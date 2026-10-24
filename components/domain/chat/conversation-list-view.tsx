'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'

type ConversationSummary = {
  id: string
  status: string
  closedReason: string | null
  lastMessageAt: Date | string | null
  createdAt: Date | string
  patientFirstName: string
  patientLastName: string
  professionalName: string
  professionalPhotoUrl: string | null
  lastMessage: { body: string; createdAt: Date | string } | null
  unreadCount: number
}

export function ConversationListView({
  conversations,
  role,
}: {
  conversations: ConversationSummary[]
  role: 'patient' | 'professional'
}) {
  const basePath = role === 'patient' ? '/paciente/mensajes' : '/profesional/mensajes'

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <Icon icon={icons.MessageSquare} size="md" />
        </span>
        <h2 className="text-xl font-semibold text-foreground">No tenés conversaciones activas</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {role === 'patient'
            ? 'Iniciá una conversación desde el perfil de cualquier profesional para realizar consultas antes del primer turno.'
            : 'Las conversaciones con tus pacientes aparecerán aquí cuando te escriban.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {conversations.map((c) => {
        const otherPartyName =
          role === 'patient' ? c.professionalName : `${c.patientFirstName} ${c.patientLastName}`

        return (
          <Link key={c.id} href={`${basePath}/${c.id}`}>
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {otherPartyName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{otherPartyName}</span>
                      <Badge
                        variant={
                          c.status === 'bond'
                            ? 'default'
                            : c.status === 'pre_bond'
                              ? 'secondary'
                              : 'outline'
                        }
                        className="text-xs"
                      >
                        {c.status === 'bond'
                          ? 'Vínculo'
                          : c.status === 'pre_bond'
                            ? 'Consulta previa'
                            : c.status === 'blocked'
                              ? 'Bloqueada'
                              : 'Cerrada'}
                      </Badge>
                    </div>
                    {c.lastMessage ? (
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {c.lastMessage.body}
                      </p>
                    ) : (
                      <p className="text-xs italic text-muted-foreground">Sin mensajes previos</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {c.lastMessageAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.lastMessageAt).toLocaleDateString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                  {c.unreadCount > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 rounded-full px-1 text-xs">
                      {c.unreadCount}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
