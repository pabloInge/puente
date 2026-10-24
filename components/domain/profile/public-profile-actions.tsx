'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Icon, icons } from '@/components/ui/icon'
import { Textarea } from '@/components/ui/textarea'

type PublicProfileActionsProps = {
  professionalId: string
  professionalName: string
  userRole?: string | null
  isLoggedIn: boolean
}

export function PublicProfileActions({
  professionalId,
  professionalName,
  userRole,
  isLoggedIn,
}: PublicProfileActionsProps) {
  const router = useRouter()
  const [chatOpen, setChatOpen] = useState(false)
  const [bondOpen, setBondOpen] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [bondMessage, setBondMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col gap-3">
        <Link
          href={`/ingresar?next=/profesionales/${professionalId}`}
          className={buttonVariants({ variant: 'default', size: 'lg', className: 'w-full' })}
        >
          <Icon icon={icons.MessageSquare} size="sm" data-icon="inline-start" />
          Contactar al profesional
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          Iniciá sesión o registrate para poder conversar y coordinar turnos.
        </p>
      </div>
    )
  }

  if (userRole !== 'patient') {
    return (
      <div className="rounded-lg border border-border bg-surface-1 p-4 text-center text-sm text-muted-foreground">
        Estás navegando como profesional o administrador. Las solicitudes de contacto solo están habilitadas para pacientes.
      </div>
    )
  }

  async function handleStartChat(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professionalId, initialMessage: messageText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al iniciar conversación')
      router.push(`/paciente/mensajes/${data.conversationId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestBond(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bonds/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professionalId, requestMessage: bondMessage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al solicitar vínculo')
      setBondOpen(false)
      router.push('/paciente/tratamiento')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Contact Button & Dialog */}
      <Button size="lg" className="w-full" onClick={() => setChatOpen(true)}>
        <Icon icon={icons.MessageSquare} size="sm" data-icon="inline-start" />
        Escribir mensaje previo
      </Button>

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escribile a {professionalName}</DialogTitle>
            <DialogDescription>
              Podés hacer preguntas sobre su modalidad de atención u honorarios antes de solicitar el vínculo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStartChat} className="flex flex-col gap-4">
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <Textarea
              placeholder="Hola, me gustaría saber si atendés por online y qué disponibilidad tenés..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              required
              rows={4}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChatOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar mensaje'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bond Request Button & Dialog */}
      <Button variant="outline" size="lg" className="w-full" onClick={() => setBondOpen(true)}>
        <Icon icon={icons.Handshake} size="sm" data-icon="inline-start" />
        Solicitar vínculo terapéutico
      </Button>

      <Dialog open={bondOpen} onOpenChange={setBondOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitud de vínculo con {professionalName}</DialogTitle>
            <DialogDescription>
              Al solicitar vínculo, el profesional revisará tu pedido. Una vez aceptado y completado el consentimiento informado, podrán coordinar las sesiones.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestBond} className="flex flex-col gap-4">
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <Textarea
              placeholder="Contale brevemente qué te motivó a consultar o qué objetivos te gustaría trabajar..."
              value={bondMessage}
              onChange={(e) => setBondMessage(e.target.value)}
              required
              rows={4}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBondOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Confirmar solicitud'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
