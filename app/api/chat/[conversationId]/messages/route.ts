import { NextResponse } from 'next/server'
import { getConversation } from '@/lib/services/chat'
import { getSession } from '@/lib/session'

type RouteContext = {
  params: Promise<{ conversationId: string }>
}

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    const { conversationId } = await params
    const { messages } = await getConversation(session, conversationId)
    return NextResponse.json(messages)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
