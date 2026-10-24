import { NextResponse } from 'next/server'
import { commentIndication } from '@/lib/services/indications'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { indicationId, body } = await req.json()
    const comment = await commentIndication(session, indicationId, body)
    return NextResponse.json(comment)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
