'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Icon, icons } from '@/components/ui/icon'
import { Textarea } from '@/components/ui/textarea'

type MessageItem = {
  id: string
  conversationId: string
  senderUserId: string
  body: string
  attachmentUrl: string | null
  readAt: Date | string | null
  createdAt: Date | string
}

type ChatRoomViewProps = {
  conversation: {
    id: string
    patientId: string
    professionalId: string
    status: string
    patientMessagesBeforeReply: number
    closedReason: string | null
    patientFirstName: string
    patientLastName: string
    patientUserId: string
    professionalName: string
    professionalUserId: string
    professionalPhotoUrl: string | null
  }
  initialMessages: MessageItem[]
  currentUserId: string
  currentUserRole: 'patient' | 'professional'
}

export function ChatRoomView({
  conversation,
  initialMessages,
  currentUserId,
  currentUserRole,
}: ChatRoomViewProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages)
  const [inputBody, setInputBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isClosed = conversation.status === 'closed' || conversation.status === 'blocked'
  const otherPartyName =
    currentUserRole === 'patient'
      ? conversation.professionalName
      : `${conversation.patientFirstName} ${conversation.patientLastName}`

  // Scroll to bottom on initial render and new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Polling SWR / interval for new messages (5 seconds)
  useEffect(() => {
    if (isClosed) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/${conversation.id}/messages`)
        if (res.ok) {
          const fresh = await res.json()
          if (fresh.length !== messages.length) {
            setMessages(fresh)
          }
        }
      } catch (err) {
        // Silent polling failure
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [conversation.id, isClosed, messages.length])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!inputBody.trim()) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          body: inputBody.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al enviar mensaje')

      setMessages((prev) => [...prev, data])
      setInputBody('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCloseConversation() {
    if (!confirm('¿Seguro que querés dar por cerrada esta conversación?')) return
    try {
      await fetch('/api/chat/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversation.id }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const backUrl = currentUserRole === 'patient' ? '/paciente/mensajes' : '/profesional/mensajes'

  return (
    <div className="flex h-[75vh] flex-col rounded-xl border border-border bg-surface-1 shadow-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-surface-2 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href={backUrl} className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'p-2' })}>
            <Icon icon={icons.ArrowLeft} size="sm" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-base">{otherPartyName}</span>
              <Badge
                variant={
                  conversation.status === 'bond'
                    ? 'default'
                    : conversation.status === 'pre_bond'
                      ? 'secondary'
                      : 'outline'
                }
                className="text-xs"
              >
                {conversation.status === 'bond'
                  ? 'Vínculo activo'
                  : conversation.status === 'pre_bond'
                    ? 'Consulta previa'
                    : conversation.status === 'blocked'
                      ? 'Bloqueada'
                      : 'Cerrada'}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {currentUserRole === 'patient' ? 'Profesional de salud mental' : 'Paciente'}
            </span>
          </div>
        </div>

        {currentUserRole === 'professional' && !isClosed && (
          <Button variant="outline" size="sm" onClick={handleCloseConversation}>
            Cerrar conversación
          </Button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground italic">
            No hay mensajes aún en esta conversación.
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderUserId === currentUserId
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-xs'
                      : 'bg-surface-2 text-foreground rounded-bl-xs border border-border'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </div>
                <div className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                  <span>
                    {new Date(m.createdAt).toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isMe && (
                    <span>
                      {m.readAt ? (
                        <Icon icon={icons.CheckCheck} size="sm" className="text-primary" />
                      ) : (
                        <Icon icon={icons.Check} size="sm" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Composer or Closed Banner */}
      <div className="border-t border-border bg-surface-2 p-4">
        {error && (
          <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
            {error}
          </div>
        )}

        {isClosed ? (
          <div className="rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground">
            Esta conversación se encuentra cerrada o finalizada. No es posible enviar nuevos mensajes.
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-end gap-3">
            <Textarea
              placeholder="Escribí tu mensaje acá..."
              value={inputBody}
              onChange={(e) => setInputBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
              rows={2}
              className="resize-none"
              disabled={loading}
            />
            <Button type="submit" size="sm" disabled={loading || !inputBody.trim()}>
              <Icon icon={icons.Send} size="sm" data-icon="inline-start" />
              {loading ? 'Enviando...' : 'Enviar'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
