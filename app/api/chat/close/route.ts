import { NextResponse } from 'next/server'
import { closeConversation } from '@/lib/services/chat'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { conversationId } = await req.json()
    const closed = await closeConversation(session, conversationId)
    return NextResponse.json(closed)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
