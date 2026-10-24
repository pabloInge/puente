import { NextResponse } from 'next/server'
import { generateHistoricDraft } from '@/lib/services/summaries'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { bondId } = await req.json()
    const draft = await generateHistoricDraft(session, bondId)
    return NextResponse.json({ draft })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
