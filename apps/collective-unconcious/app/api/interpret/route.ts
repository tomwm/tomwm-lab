import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { initDb, insertDreamSubmission, getCountsForToday, getItemHistory } from "@/lib/db";
import fs from "fs";
import path from "path";

function getApiKey(): string {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    const match = envFile.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match) return match[1].trim();
  } catch { /* file not found */ }
  throw new Error("ANTHROPIC_API_KEY is not set");
}

const SYSTEM_PROMPT = `You are a dream interpreter who writes in a poetic, Jungian style.
You help people understand the symbolic meaning of their dreams with warmth and insight.
You always respond with valid JSON — nothing else, no markdown fences, no explanation.`;

function buildUserPrompt(dream: string): string {
  return `Interpret this dream and extract its key themes and symbols.

Dream:
"""
${dream}
"""

Respond with a JSON object in exactly this shape:
{
  "interpretation": "<a ~150 word poetic interpretation in second person>",
  "themes": ["<theme1>", "<theme2>", "<theme3>"],
  "symbols": ["<symbol1>", "<symbol2>", "<symbol3>"]
}

Rules for THEMES (broad archetypal patterns):
- Between 3 and 5 themes
- Prefer a single lowercase noun or gerund (e.g. "flying", "loss", "pursuit", "transformation")
- Use the most common, canonical form — e.g. always "flying" not "flight" or "soaring"; always "water" not "ocean" or "sea" unless ocean/sea is clearly more accurate
- Archetypal and broadly relatable — must be themes that many people could share
- No theme longer than 2 words
- Never use adjectives alone — use noun or verb forms

Rules for SYMBOLS (specific concrete elements that appeared):
- Between 3 and 6 symbols
- The actual people, creatures, objects, or places in the dream (e.g. "grandmother", "black cat", "locked door", "flowers")
- Use the simplest, most generic form — e.g. "cat" not "black cat", "door" not "locked door", unless the modifier is essential to the meaning
- Lowercase single nouns where possible — no more than 2 words
- Must be concrete things that appeared, not abstract concepts

Rules for interpretation:
- Approximately 150 words total
- 2 to 3 short paragraphs, separated by \n\n
- Poetic but accessible — no academic jargon
- Use second person ("you", "your")
- End the final paragraph with a gentle open question for the dreamer

Respond with the JSON object only. No other text.`;
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export async function POST(request: NextRequest) {
  const client = new Anthropic({ apiKey: getApiKey() });
  try {
    await initDb();

    const body = await request.json();
    const dream: string = (body?.dream ?? "").trim();

    if (dream.length < 10) {
      return NextResponse.json(
        { error: "Please describe your dream in a bit more detail." },
        { status: 400 }
      );
    }
    if (dream.length > 5000) {
      return NextResponse.json(
        { error: "Dream description is too long (max 5000 characters)." },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(dream) }],
    });

    const rawText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    let parsed: { interpretation: string; themes: string[]; symbols: string[] };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const stripped = rawText.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
      parsed = JSON.parse(stripped);
    }

    const { interpretation, themes, symbols } = parsed;

    if (!interpretation || !Array.isArray(themes) || !Array.isArray(symbols)) {
      throw new Error("Unexpected response structure from Claude");
    }

    const normThemes = [...new Set(themes.map((t: string) => t.toLowerCase().trim()))].slice(0, 5);
    const normSymbols = [...new Set(symbols.map((s: string) => s.toLowerCase().trim()))].slice(0, 6);
    const today = getTodayDateString();

    await insertDreamSubmission(today, normThemes, normSymbols);

    const [{ themeCounts, symbolCounts }, ...histories] = await Promise.all([
      getCountsForToday(today, normThemes, normSymbols),
      ...normThemes.map(t => getItemHistory("themes", t, 7)),
      ...normSymbols.map(s => getItemHistory("symbols", s, 7)),
    ]);

    const themeHistory: Record<string, { date: string; count: number }[]> = {};
    normThemes.forEach((t, i) => { themeHistory[t] = histories[i]; });

    const symbolHistory: Record<string, { date: string; count: number }[]> = {};
    normSymbols.forEach((s, i) => { symbolHistory[s] = histories[normThemes.length + i]; });

    return NextResponse.json({
      interpretation,
      themes: normThemes,
      themeCounts,
      themeHistory,
      symbols: normSymbols,
      symbolCounts,
      symbolHistory,
    });
  } catch (err) {
    console.error("[/api/interpret]", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Something went wrong while interpreting your dream. Please try again." },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
