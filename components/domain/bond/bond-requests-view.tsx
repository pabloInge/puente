'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
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

type BondRequestItem = {
  id: string
  status: string
  requestMessage: string | null
  requestedAt: Date | string
  preview: {
    firstName: string
    age: number | null
    province: string | null
    initialTopics: string | null
    requestMessage: string | null
  }
}

export function BondRequestsView({
  requests,
}: {
  requests: BondRequestItem[]
}) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleAccept(id: string) {
    setLoadingId(id)
    setError(null)
    try {
      const res = await fetch('/api/bonds/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bondId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al aceptar solicitud.')
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
      const res = await fetch('/api/bonds/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bondId: rejectingId, reason: rejectReason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al rechazar solicitud.')
      setRejectingId(null)
      setRejectReason('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="font-medium text-foreground">No tenés solicitudes de vínculo pendientes.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando un paciente solicite iniciar un proceso terapéutico con vos, aparecerá en esta bandeja.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground text-lg">{req.preview.firstName}</h3>
                    <Badge variant="outline" className="text-xs">
                      {req.preview.age ? `${req.preview.age} años` : 'Mayor de 18'}
                    </Badge>
                  </div>
                  {req.preview.province && (
                    <p className="text-xs text-muted-foreground">{req.preview.province}</p>
                  )}
                </div>

                <span className="text-xs text-muted-foreground">
                  {new Date(req.requestedAt).toLocaleDateString('es-AR')}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                {req.preview.initialTopics && (
                  <div>
                    <span className="font-medium text-foreground">Temas de interés: </span>
                    <span className="text-muted-foreground">{req.preview.initialTopics}</span>
                  </div>
                )}
                {req.requestMessage && (
                  <div className="rounded-lg bg-surface-2 p-3 text-muted-foreground">
                    <span className="font-medium text-foreground block mb-1">Mensaje del paciente:</span>
                    <p className="italic">{req.requestMessage}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-3 border-t border-border pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectingId(req.id)}
                  disabled={loadingId === req.id}
                >
                  Rechazar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAccept(req.id)}
                  disabled={loadingId === req.id}
                >
                  <Icon icon={icons.Check} size="sm" data-icon="inline-start" />
                  {loadingId === req.id ? 'Aceptando...' : 'Aceptar solicitud'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={Boolean(rejectingId)} onOpenChange={(o) => !o && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud de vínculo</DialogTitle>
            <DialogDescription>
              El paciente será notificado con el motivo indicado para que pueda continuar su búsqueda.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReject} className="flex flex-col gap-4">
            <Textarea
              placeholder="Ej: Sin disponibilidad horaria en este momento / fuera del campo de especialidad..."
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
                Confirmar rechazo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
