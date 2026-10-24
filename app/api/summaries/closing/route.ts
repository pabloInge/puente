import { NextResponse } from 'next/server'
import {
  approveClosingSummary,
  attachClosingSummaryToPastExperience,
  generateClosingDraft,
  requestClosingSummary,
  saveClosingDraft,
} from '@/lib/services/summaries'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const body = await req.json()

    if (body.action === 'request') {
      const summary = await requestClosingSummary(session, body.bondId)
      return NextResponse.json(summary)
    }

    if (body.action === 'draft') {
      const draft = await generateClosingDraft(session, body.bondId)
      return NextResponse.json({ draft })
    }

    if (body.action === 'save_draft') {
      const summary = await saveClosingDraft(session, body.bondId, body.content)
      return NextResponse.json(summary)
    }

    if (body.action === 'approve') {
      const summary = await approveClosingSummary(session, body.bondId, body.content)
      return NextResponse.json(summary)
    }

    if (body.action === 'attach') {
      const experience = await attachClosingSummaryToPastExperience(
        session,
        body.bondId,
        body.summaryId,
      )
      return NextResponse.json(experience)
    }

    return NextResponse.json({ message: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
