import { NextResponse } from 'next/server'
import { archiveIndication } from '@/lib/services/indications'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { indicationId } = await req.json()
    const archived = await archiveIndication(session, indicationId)
    return NextResponse.json(archived)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
