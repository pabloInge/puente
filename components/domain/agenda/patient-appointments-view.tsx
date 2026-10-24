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

type AppointmentItem = {
  id: string
  professionalId: string
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
  professionalName: string
  professionalPhotoUrl: string | null
}

export function PatientAppointmentsView({
  appointments,
  hasActiveBond,
}: {
  appointments: AppointmentItem[]
  hasActiveBond: boolean
}) {
  const router = useRouter()
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upcoming = appointments.filter(
    (a) => a.status === 'requested' || a.status === 'confirmed',
  )
  const past = appointments.filter(
    (a) => a.status !== 'requested' && a.status !== 'confirmed',
  )

  async function handleCancel(e: React.FormEvent) {
    e.preventDefault()
    if (!cancellingId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/agenda/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: cancellingId,
          reason: cancelReason,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al cancelar turno')
      setCancellingId(null)
      setCancelReason('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {/* Upcoming Appointments */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Próximos turnos</h2>
          {hasActiveBond && (
            <Link href="/paciente/tratamiento" className={buttonVariants({ size: 'sm' })}>
              <Icon icon={icons.Plus} size="sm" data-icon="inline-start" />
              Coordinar turno
            </Link>
          )}
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No tenés turnos programados próximos.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {upcoming.map((apt) => {
              const start = new Date(apt.startsAt)
              const end = new Date(apt.endsAt)
              const isOnline = apt.modality === 'online' || apt.modality === 'both'

              return (
                <Card key={apt.id} className="flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base text-foreground">{apt.serviceName}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Con {apt.professionalName}
                        </p>
                      </div>
                      <Badge
                        variant={apt.status === 'confirmed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {apt.status === 'confirmed' ? 'Confirmado' : 'Pendiente de confirmación'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <Icon icon={icons.Calendar} size="sm" className="text-primary" />
                      <span>{start.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Icon icon={icons.Clock} size="sm" />
                      <span>
                        {start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} ({apt.durationMin} min)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Icon icon={isOnline ? icons.Video : icons.Building2} size="sm" />
                      <span>{isOnline ? 'Sesión online por videollamada' : 'Atención presencial en consultorio'}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCancellingId(apt.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      Cancelar
                    </Button>

                    {isOnline && apt.status === 'confirmed' && (
                      <Link
                        href={`/sesion/${apt.id}`}
                        className={buttonVariants({ size: 'sm', variant: 'default' })}
                      >
                        <Icon icon={icons.Video} size="sm" data-icon="inline-start" />
                        Ir a la sala
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      {past.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">Historial de turnos</h2>
          <div className="flex flex-col gap-2">
            {past.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-1 p-3 text-sm"
              >
                <div>
                  <span className="font-medium text-foreground">{apt.serviceName}</span>
                  <span className="text-muted-foreground text-xs ml-2">
                    {new Date(apt.startsAt).toLocaleDateString('es-AR')} · {apt.professionalName}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {apt.status === 'completed'
                    ? 'Completado'
                    : apt.status === 'cancelled'
                      ? 'Cancelado'
                      : apt.status === 'rescheduled'
                        ? 'Reprogramado'
                        : apt.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog open={Boolean(cancellingId)} onOpenChange={(o) => !o && setCancellingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar turno</DialogTitle>
            <DialogDescription>
              Cancelaciones con menos de 24 horas de aviso se consideran cancelaciones tardías (R-10).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCancel} className="flex flex-col gap-4">
            <Textarea
              placeholder="Indicá el motivo de la cancelación..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
              rows={3}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCancellingId(null)}>
                Volver
              </Button>
              <Button type="submit" variant="destructive" disabled={loading}>
                {loading ? 'Cancelando...' : 'Confirmar cancelación'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
