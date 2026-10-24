import { NextResponse } from 'next/server'
import { sendMessage } from '@/lib/services/chat'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const msg = await sendMessage(session, body)

    return NextResponse.json(msg)
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error al enviar mensaje' },
      { status: error.status || 400 },
    )
  }
}
