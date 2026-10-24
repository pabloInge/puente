'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Icon, icons } from '@/components/ui/icon'
import { Textarea } from '@/components/ui/textarea'

type ProAppointmentItem = {
  id: string
  patientId: string
  bondId: string | null
  startsAt: Date | string
  endsAt: Date | string
  modality: 'in_person' | 'online' | 'both'
  status: string
  cancelReason: string | null
  lateCancellation: boolean
  videoRoomName: string | null
  serviceName: string
  durationMin: number
  fee: number | null
  patientFirstName: string
  patientLastName: string
}

export function ProfessionalAgendaView({
  appointments,
}: {
  appointments: ProAppointmentItem[]
}) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const pending = appointments.filter((a) => a.status === 'requested')
  const confirmed = appointments.filter((a) => a.status === 'confirmed')
  const past = appointments.filter(
    (a) => a.status !== 'requested' && a.status !== 'confirmed',
  )

  async function handleConfirm(id: string) {
    setLoadingId(id)
    setError(null)
    try {
      const res = await fetch('/api/agenda/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al confirmar turno')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault()
    if (!rejectingId) return
    setLoadingId(rejectingId)
    setError(null)
    try {
      const res = await fetch('/api/agenda/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: rejectingId,
          reason: rejectReason,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al rechazar turno')
      setRejectingId(null)
      setRejectReason('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  async function handleComplete(id: string) {
    setLoadingId(id)
    try {
      await fetch('/api/agenda/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  async function handleNoShow(id: string) {
    if (!confirm('¿Marcar al paciente como ausente sin aviso?')) return
    setLoadingId(id)
    try {
      await fetch('/api/agenda/no-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {/* Pending Confirmation */}
      {pending.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            Solicitudes de turno ({pending.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pending.map((apt) => (
              <Card key={apt.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base text-foreground">
                        {apt.patientFirstName} {apt.patientLastName}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{apt.serviceName}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Pendiente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {new Date(apt.startsAt).toLocaleDateString('es-AR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    a las{' '}
                    {new Date(apt.startsAt).toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs">Modalidad: {apt.modality}</p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t border-border pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectingId(apt.id)}
                    disabled={loadingId === apt.id}
                  >
                    Rechazar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleConfirm(apt.id)}
                    disabled={loadingId === apt.id}
                  >
                    <Icon icon={icons.Check} size="sm" data-icon="inline-start" />
                    Confirmar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Appointments */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-foreground">Agenda próxima</h2>
        {confirmed.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No tenés turnos confirmados en los próximos días.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {confirmed.map((apt) => {
              const isOnline = apt.modality === 'online' || apt.modality === 'both'
              return (
                <Card key={apt.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base text-foreground">
                          {apt.patientFirstName} {apt.patientLastName}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{apt.serviceName}</p>
                      </div>
                      <Badge variant="default" className="text-xs">
                        Confirmado
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Icon icon={icons.Calendar} size="sm" className="text-primary" />
                      <span>
                        {new Date(apt.startsAt).toLocaleDateString('es-AR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon icon={icons.Clock} size="sm" />
                      <span>
                        {new Date(apt.startsAt).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(apt.endsAt).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleComplete(apt.id)}
                        disabled={loadingId === apt.id}
                      >
                        Completar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNoShow(apt.id)}
                        disabled={loadingId === apt.id}
                        className="text-xs text-muted-foreground"
                      >
                        Ausente
                      </Button>
                    </div>

                    {isOnline && (
                      <Link
                        href={`/sesion/${apt.id}`}
                        className={buttonVariants({ size: 'sm', variant: 'default' })}
                      >
                        <Icon icon={icons.Video} size="sm" data-icon="inline-start" />
                        Entrar a sala
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={Boolean(rejectingId)} onOpenChange={(o) => !o && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar turno</DialogTitle>
            <DialogDescription>
              El paciente será notificado del motivo de rechazo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReject} className="flex flex-col gap-4">
            <Textarea
              placeholder="Motivo del rechazo o imposibilidad horaria..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
              rows={3}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejectingId(null)}>
                Volver
              </Button>
              <Button type="submit" variant="destructive" disabled={Boolean(loadingId)}>
                Rechazar turno
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
