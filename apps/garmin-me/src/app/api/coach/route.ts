import { NextResponse } from 'next/server'
import { askCoach, type Turn } from '@/lib/ai/ask'
import { storedInsights, storedWorkout, suggestWorkout, writeInsights } from '@/lib/ai/coach'
import { AiError, getProvider } from '@/lib/ai/provider'
import { loadData } from '@/lib/data'
import { today } from '@/lib/dates'

export const dynamic = 'force-dynamic'

// One request of each kind at a time: a local model can only do one thing well at once.
const busy = new Set<string>()

export async function GET() {
  const ai = getProvider()
  return NextResponse.json({ status: await ai.status(), model: ai.label, workout: storedWorkout(), insights: storedInsights() })
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  if (origin && new URL(origin).host !== req.headers.get('host')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const body = (await req.json().catch(() => ({}))) as { action?: string; question?: unknown; history?: unknown }
  const action = body.action
  if (action !== 'workout' && action !== 'insights' && action !== 'ask') {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  }
  const status = await getProvider().status()
  if (!status.ok) return NextResponse.json({ error: status.reason }, { status: 503 })
  if (busy.has(action)) return NextResponse.json({ error: 'Already working on that. Give it a moment.' }, { status: 409 })

  busy.add(action)
  try {
    const data = loadData()
    if (action === 'workout') return NextResponse.json(await suggestWorkout(data, today()))
    if (action === 'insights') return NextResponse.json(await writeInsights(data, today()))
    const question = typeof body.question === 'string' ? body.question.trim().slice(0, 500) : ''
    if (!question) return NextResponse.json({ error: 'Type a question first.' }, { status: 400 })
    const history: Turn[] = Array.isArray(body.history)
      ? body.history
          .filter((t): t is Turn => !!t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string')
          .map((t) => ({ role: t.role, content: t.content.slice(0, 4000) }))
      : []
    return NextResponse.json(await askCoach(data, question, history))
  } catch (e) {
    const message = e instanceof AiError ? e.message : `Something went wrong: ${(e as Error).message}`
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    busy.delete(action)
  }
}
