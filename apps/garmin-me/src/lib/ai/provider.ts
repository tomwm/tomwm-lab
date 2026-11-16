/**
 * The one place the app talks to an AI model. Everything else calls
 * getProvider().chat(...), so switching to another local model, or later to
 * a hosted one, is a change here and nowhere else.
 *
 * Settings (all optional, e.g. in .env.local):
 *   GARMIN_ME_AI_MODEL   Ollama model name (default gemma4:12b)
 *   OLLAMA_HOST          default http://127.0.0.1:11434
 */
import 'server-only'

export type ToolDef = { name: string; description: string; parameters: Record<string, unknown> }
export type ToolCall = { name: string; arguments: Record<string, unknown> }
export type AiMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: ToolCall[] }
  | { role: 'tool'; name: string; content: string }

export type ChatOptions = {
  messages: AiMessage[]
  /** JSON Schema the reply must follow. */
  format?: Record<string, unknown>
  tools?: ToolDef[]
}
export type ChatResult = { content: string; toolCalls: ToolCall[]; ms: number; outputTokens: number | null }

export interface AiProvider {
  /** Shown to you, e.g. "Gemma 4 12B on this Mac". */
  label: string
  model: string
  status(): Promise<{ ok: true } | { ok: false; reason: string }>
  chat(opts: ChatOptions): Promise<ChatResult>
}

export class AiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiError'
  }
}

const MODEL_LABELS: Record<string, string> = {
  'gemma4:12b': 'Gemma 4 12B',
  'qwen2.5:7b': 'Qwen 2.5 7B',
  'llama3.1:8b': 'Llama 3.1 8B',
}

class OllamaProvider implements AiProvider {
  readonly label: string
  constructor(
    readonly model: string,
    private host: string,
  ) {
    this.label = `${MODEL_LABELS[model] ?? model} on this Mac`
  }

  async status() {
    try {
      const res = await fetch(`${this.host}/api/tags`, { signal: AbortSignal.timeout(3000), cache: 'no-store' })
      const json = (await res.json()) as { models?: { name: string }[] }
      if (!json.models?.some((m) => m.name === this.model || m.name === `${this.model}:latest`)) {
        return { ok: false as const, reason: `Ollama is running but doesn't have the model "${this.model}". Run: ollama pull ${this.model}` }
      }
      return { ok: true as const }
    } catch {
      return { ok: false as const, reason: 'Ollama isn’t running. Open the Ollama app (or run `ollama serve`) and try again.' }
    }
  }

  async chat({ messages, format, tools }: ChatOptions): Promise<ChatResult> {
    const started = Date.now()
    const body = {
      model: this.model,
      stream: false,
      // Gemma 4 otherwise reasons at length first: ~100s instead of ~20s, for no gain on these tasks.
      think: false,
      keep_alive: '10m',
      options: { temperature: 0.3, num_ctx: 8192 },
      format,
      tools: tools?.map((t) => ({ type: 'function', function: t })),
      messages: messages.map((m) =>
        m.role === 'assistant'
          ? { role: 'assistant', content: m.content, tool_calls: m.toolCalls?.map((c) => ({ function: { name: c.name, arguments: c.arguments } })) }
          : m.role === 'tool'
            ? { role: 'tool', tool_name: m.name, content: m.content }
            : m,
      ),
    }
    let res: Response
    try {
      res = await fetch(`${this.host}/api/chat`, {
        method: 'POST',
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(280_000),
        cache: 'no-store',
      })
    } catch (e) {
      const timedOut = (e as Error).name === 'TimeoutError'
      throw new AiError(timedOut ? 'The local model took too long to answer. Try again; the first run after a while is slower while it loads.' : 'Couldn’t reach Ollama. Is it running?')
    }
    const json = (await res.json().catch(() => null)) as {
      error?: string
      message?: { content?: string; tool_calls?: { function: { name: string; arguments: Record<string, unknown> | string } }[] }
      eval_count?: number
    } | null
    if (!res.ok || !json || json.error) throw new AiError(`Ollama error: ${json?.error ?? `HTTP ${res.status}`}`)
    return {
      content: json.message?.content ?? '',
      toolCalls: (json.message?.tool_calls ?? []).map((c) => ({
        name: c.function.name,
        arguments: typeof c.function.arguments === 'string' ? safeParse(c.function.arguments) : c.function.arguments ?? {},
      })),
      ms: Date.now() - started,
      outputTokens: json.eval_count ?? null,
    }
  }
}

function safeParse(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s)
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

export function getProvider(): AiProvider {
  return new OllamaProvider(
    process.env.GARMIN_ME_AI_MODEL?.trim() || 'gemma4:12b',
    (process.env.OLLAMA_HOST?.trim() || 'http://127.0.0.1:11434').replace(/\/$/, ''),
  )
}
