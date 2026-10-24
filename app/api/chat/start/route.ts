import { NextResponse } from 'next/server'
import { startPreBondConversation, sendMessage } from '@/lib/services/chat'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    }

    const { professionalId, initialMessage } = await req.json()
    if (!professionalId) {
      return NextResponse.json({ message: 'ID de profesional requerido' }, { status: 400 })
    }

    const conv = await startPreBondConversation(session, professionalId)

    if (initialMessage && initialMessage.trim().length > 0) {
      await sendMessage(session, {
        conversationId: conv.id,
        body: initialMessage.trim(),
      })
    }

    return NextResponse.json({ conversationId: conv.id })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error al iniciar conversación' },
      { status: error.status || 400 },
    )
  }
}
