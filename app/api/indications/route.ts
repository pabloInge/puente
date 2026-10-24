import { NextResponse } from 'next/server'
import { createIndication } from '@/lib/services/indications'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const body = await req.json()
    const indication = await createIndication(session, body)
    return NextResponse.json(indication)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
