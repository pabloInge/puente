import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getConversation } from '@/lib/services/chat'
import { getSession } from '@/lib/session'
import { ChatRoomView } from '@/components/domain/chat/chat-room-view'

type PageProps = {
  params: Promise<{ conversationId: string }>
}

export const metadata: Metadata = {
  title: 'Conversación — Puente',
}

export default async function PatientConversationDetailPage({ params }: PageProps) {
  const { conversationId } = await params
  const session = await getSession()
  if (!session || session.user.role !== 'patient') {
    redirect('/ingresar')
  }

  let data
  try {
    data = await getConversation(session, conversationId)
  } catch {
    notFound()
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <ChatRoomView
        conversation={data.conversation}
        initialMessages={data.messages}
        currentUserId={session.user.id}
        currentUserRole="patient"
      />
    </div>
  )
}
