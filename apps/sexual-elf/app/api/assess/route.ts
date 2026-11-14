import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildAssessSystemPrompt } from '@/lib/prompts';
import { RiskAssessmentSchema } from '@/lib/riskSchema';
import type { WizardAnswers } from '@/lib/types';

const client = new Anthropic();

async function callClaude(systemPrompt: string, userContent: string): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  });

  const block = msg.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text;
}

function extractJSON(raw: string): string {
  // Strip markdown fences if Claude wraps in ```json ... ```
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Find first { to last }
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw.trim();
}

export async function POST(req: NextRequest) {
  let wizardAnswers: WizardAnswers;
  try {
    wizardAnswers = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const systemPrompt = buildAssessSystemPrompt();
  const userContent = `Here are the user's wizard answers:\n\n${JSON.stringify(wizardAnswers, null, 2)}\n\nPlease produce the risk assessment JSON.`;

  let raw: string;
  try {
    raw = await callClaude(systemPrompt, userContent);
  } catch (err) {
    console.error('Claude assess call failed:', err);
    return NextResponse.json({ error: 'Assessment service unavailable' }, { status: 502 });
  }

  // First parse attempt
  let parsed = tryParse(raw);

  // Retry once if parse fails
  if (!parsed.success) {
    try {
      const fixPrompt = `Your previous response was not valid JSON or failed schema validation. Error: ${parsed.error}\n\nPlease return ONLY the corrected JSON object with no markdown, no preamble.\n\nYour previous response was:\n${raw}`;
      const retryRaw = await callClaude(systemPrompt, fixPrompt);
      parsed = tryParse(retryRaw);
    } catch {
      // fall through to error below
    }
  }

  if (!parsed.success || !parsed.data) {
    console.error('Zod validation failed after retry:', parsed.error);
    return NextResponse.json({ error: 'Failed to generate a valid assessment. Please try again.' }, { status: 500 });
  }

  return NextResponse.json(parsed.data);
}

function tryParse(raw: string): { success: true; data: ReturnType<typeof RiskAssessmentSchema.parse> } | { success: false; error: string; data?: undefined } {
  try {
    const jsonStr = extractJSON(raw);
    const obj = JSON.parse(jsonStr);
    const data = RiskAssessmentSchema.parse(obj);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
