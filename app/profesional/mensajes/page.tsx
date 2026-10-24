import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { listConversations } from '@/lib/services/chat'
import { getSession } from '@/lib/session'
import { ConversationListView } from '@/components/domain/chat/conversation-list-view'

export const metadata: Metadata = {
  title: 'Mensajes — Puente',
}

export default async function ProfessionalMessagesPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'professional') {
    redirect('/ingresar')
  }

  const conversations = await listConversations(session)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Mensajes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bandeja de mensajes de consultas previas y pacientes en tratamiento.
        </p>
      </div>

      <ConversationListView conversations={conversations} role="professional" />
    </div>
  )
}
