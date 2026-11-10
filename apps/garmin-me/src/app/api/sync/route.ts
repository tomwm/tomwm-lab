import { NextResponse } from 'next/server'
import { getSyncStatus, startSync } from '@/lib/garmin/sync'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getSyncStatus())
}

export async function POST(req: Request) {
  // Local-only app, but still refuse cross-site form posts.
  const origin = req.headers.get('origin')
  if (origin && new URL(origin).host !== req.headers.get('host')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const body = (await req.json().catch(() => ({}))) as { days?: number }
  startSync(Number(body.days) || 30)
  return NextResponse.json(await getSyncStatus())
}
