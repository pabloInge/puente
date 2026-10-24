import { NextResponse } from 'next/server'
import {
  annotateWeeklySummary,
  generateWeeklySummary,
} from '@/lib/services/summaries'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const body = await req.json()

    if (body.action === 'generate') {
      const summary = await generateWeeklySummary(body.bondId, body.weekStart)
      return NextResponse.json(summary)
    }

    if (body.action === 'annotate') {
      const summary = await annotateWeeklySummary(
        session,
        body.summaryId,
        body.annotation,
        body.shareWithPatient,
      )
      return NextResponse.json(summary)
    }

    return NextResponse.json({ message: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
