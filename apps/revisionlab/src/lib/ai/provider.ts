// Server-only AI provider abstraction. Never import this from client components.
// Credentials are read from environment variables and never sent to the client.

import "server-only";

export interface AiMessageResult {
  text: string;
  model: string;
}

export interface AiProvider {
  configured: boolean;
  modelName: string;
  complete(system: string, user: string): Promise<AiMessageResult>;
}

class AnthropicProvider implements AiProvider {
  configured: boolean;
  modelName: string;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.configured = !!this.apiKey;
    this.modelName = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  }

  async complete(system: string, user: string): Promise<AiMessageResult> {
    if (!this.apiKey) throw new Error("Anthropic API key not configured");
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: this.apiKey });
    const response = await client.messages.create({
      model: this.modelName,
      // Marking returns a JSON object with verbatim essay excerpts and an
      // open-ended list of anchored comments; a truncated reply fails to parse
      // and drops her to demo feedback. Only generated tokens are billed.
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = response.content.find((b) => b.type === "text");
    return { text: block && block.type === "text" ? block.text : "", model: this.modelName };
  }
}

class OpenAiProvider implements AiProvider {
  configured: boolean;
  modelName: string;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.configured = !!this.apiKey;
    this.modelName = process.env.OPENAI_MODEL || "gpt-4o";
  }

  async complete(system: string, user: string): Promise<AiMessageResult> {
    if (!this.apiKey) throw new Error("OpenAI API key not configured");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.4,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI request failed: ${res.status}`);
    const json = await res.json();
    return { text: json.choices?.[0]?.message?.content ?? "", model: this.modelName };
  }
}

export function getAiProvider(): AiProvider {
  const preferred = process.env.AI_PROVIDER?.toLowerCase();
  if (preferred === "openai") return new OpenAiProvider();
  if (preferred === "anthropic") return new AnthropicProvider();

  // Default: prefer Anthropic if configured, else OpenAI, else an
  // unconfigured Anthropic instance (so `configured` reads false cleanly).
  const anthropic = new AnthropicProvider();
  if (anthropic.configured) return anthropic;
  const openai = new OpenAiProvider();
  if (openai.configured) return openai;
  return anthropic;
}
