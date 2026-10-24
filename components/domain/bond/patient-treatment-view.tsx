'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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

type PatientTreatmentViewProps = {
  bond: {
    id: string
    status: string
    requestedAt: Date | string
    acceptedAt: Date | string | null
    activatedAt: Date | string | null
    professionalName: string
    professionalPhotoUrl: string | null
    licenseNumber: string | null
    licenseJurisdiction: string | null
  } | null
  consentText: string | null
  intakeData: {
    needs: string
    reasonToStart: string
    submittedAt: Date | string
  } | null
}

export function PatientTreatmentView({
  bond,
  consentText,
  intakeData,
}: PatientTreatmentViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Intake form state
  const [needs, setNeeds] = useState('')
  const [reasonToStart, setReasonToStart] = useState('')

  // Break bond dialog state
  const [breakOpen, setBreakOpen] = useState(false)
  const [breakReason, setBreakReason] = useState('')

  if (!bond) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <Icon icon={icons.Handshake} size="md" />
        </span>
        <h2 className="text-xl font-semibold text-foreground">No tenés un tratamiento activo</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Encontrá a un profesional en la plataforma y solicitá iniciar un vínculo terapéutico para coordinar sesiones y realizar seguimiento.
        </p>
        <Link href="/buscar" className={buttonVariants({ className: 'mt-6' })}>
          <Icon icon={icons.Search} size="sm" data-icon="inline-start" />
          Buscar profesionales
        </Link>
      </div>
    )
  }

  async function handleAcceptConsent() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bonds/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bondId: bond?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al aceptar el consentimiento.')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitIntake(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bonds/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bondId: bond?.id,
          needs,
          reasonToStart,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al enviar el formulario inicial.')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleBreakBond(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bonds/break', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bondId: bond?.id,
          reason: breakReason,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al finalizar el vínculo.')
      setBreakOpen(false)
      router.push('/paciente/historial')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {/* Bond Header */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{bond.professionalName}</CardTitle>
              <Badge
                variant={
                  bond.status === 'active'
                    ? 'default'
                    : bond.status === 'awaiting_consent'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {bond.status === 'active'
                  ? 'Vínculo activo'
                  : bond.status === 'awaiting_consent'
                    ? 'Esperando consentimiento'
                    : 'Solicitud enviada'}
              </Badge>
            </div>
            <CardDescription className="mt-1">
              {bond.licenseJurisdiction ? `${bond.licenseJurisdiction} · ` : ''}
              {bond.licenseNumber ?? 'Matrícula en trámite'}
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/paciente/mensajes"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <Icon icon={icons.MessageSquare} size="sm" data-icon="inline-start" />
              Mensajes
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBreakOpen(true)}
              className="text-destructive hover:bg-destructive/10"
            >
              Finalizar vínculo
            </Button>

            <Dialog open={breakOpen} onOpenChange={setBreakOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Finalizar vínculo terapéutico</DialogTitle>
                  <DialogDescription>
                    Esta acción cancelará los turnos futuros pendientes y registrará el proceso en tu historial terapéutico (R-13).
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleBreakBond} className="flex flex-col gap-4">
                  <Textarea
                    placeholder="Contanos el motivo de finalización (ej: objetivos cumplidos, cambio de horario, derivación)..."
                    value={breakReason}
                    onChange={(e) => setBreakReason(e.target.value)}
                    required
                    rows={3}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setBreakOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="destructive" disabled={loading}>
                      {loading ? 'Finalizando...' : 'Confirmar finalización'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Step 1: Waiting for professional response */}
      {bond.status === 'requested' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Solicitud en revisión</CardTitle>
            <CardDescription>
              El profesional está revisando tu solicitud. En cuanto la acepte, podrás leer y firmar el consentimiento informado para activar el tratamiento.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Step 2: Awaiting consent acceptance */}
      {bond.status === 'awaiting_consent' && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Consentimiento informado vigente</CardTitle>
            <CardDescription>
              Para iniciar las sesiones y habilitar las funciones de seguimiento, tenés que leer y aceptar los términos del consentimiento informado (R-08).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-background p-4 text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
              {consentText ?? 'Cargando términos del consentimiento...'}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-border pt-4">
            <Button onClick={handleAcceptConsent} disabled={loading}>
              <Icon icon={icons.Check} size="sm" data-icon="inline-start" />
              {loading ? 'Procesando...' : 'Acepto el consentimiento informado'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Active bond - Intake Form or Summary */}
      {bond.status === 'active' && (
        <>
          {intakeData ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ficha de inicio (Intake)</CardTitle>
                <CardDescription>
                  Enviado el {new Date(intakeData.submittedAt).toLocaleDateString('es-AR')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <div>
                  <span className="font-medium text-foreground">Motivo de consulta: </span>
                  <p className="text-muted-foreground mt-0.5">{intakeData.reasonToStart}</p>
                </div>
                <div>
                  <span className="font-medium text-foreground">Expectativas y necesidades: </span>
                  <p className="text-muted-foreground mt-0.5">{intakeData.needs}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-lg">Completá tu ficha de inicio (Intake)</CardTitle>
                <CardDescription>
                  Este formulario único ayuda al profesional a preparar las primeras sesiones y definir el plan de trabajo conjunto.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmitIntake}>
                <CardContent className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">
                      ¿Qué motivó tu consulta en este momento?
                    </label>
                    <Textarea
                      value={reasonToStart}
                      onChange={(e) => setReasonToStart(e.target.value)}
                      placeholder="Contanos brevemente qué situación o malestar te llevó a dar este paso..."
                      required
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">
                      ¿Cuáles son tus principales necesidades o expectativas con respecto al espacio?
                    </label>
                    <Textarea
                      value={needs}
                      onChange={(e) => setNeeds(e.target.value)}
                      placeholder="Ej: Herramientas para momentos de crisis, ordenar mis rutinas, conversar sobre vínculos..."
                      required
                      rows={3}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t border-border pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Enviar ficha de inicio'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
