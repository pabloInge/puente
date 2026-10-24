'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

import type { PatientProgressView } from '@/lib/policies/progress'

type ProgressViewProps = {
  bondId: string
  isProfessional: boolean
  settings: {
    format: string
    stages: string[] | null
    visibilityPolicy: string
    recommendationMessage: string | null
    patientWantsToSee: boolean
  }
  view:
    | PatientProgressView
    | { state: 'visible'; recommendation: null }
    | { state: 'blocked' | 'visible' | 'hidden'; recommendation?: 'show' | 'hide' | null }
  updates: {
    id: string
    value: string
    note: string | null
    createdAt: Date | string
  }[]
}

export function ProgressView({
  bondId,
  isProfessional,
  settings,
  view,
  updates,
}: ProgressViewProps) {
  const router = useRouter()
  const [wantsToSee, setWantsToSee] = useState(settings.patientWantsToSee)
  const [newVal, setNewVal] = useState('')
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleToggleVisibility(checked: boolean) {
    setWantsToSee(checked)
    try {
      await fetch('/api/progress/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bondId,
          format: settings.format,
          visibilityPolicy: settings.visibilityPolicy,
          patientWantsToSee: checked,
        }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleAddUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!newVal) return
    setLoading(true)
    try {
      await fetch('/api/progress/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bondId,
          value: parseFloat(newVal),
          note: newNote.trim() || null,
        }),
      })
      setNewVal('')
      setNewNote('')
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Patient view: blocked policy (R-05)
  if (!isProfessional && view.state === 'blocked') {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-8 text-center shadow-2">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-4">
          <Icon icon={icons.TrendingUp} size="md" />
        </span>
        <h2 className="text-xl font-semibold text-foreground">Visualización pausada</h2>
        <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
          {settings.recommendationMessage ??
            'Tu profesional considera prioritario enfocar el trabajo en la experiencia cotidiana antes que en métricas formales. Podés charlar sobre esto en tu próxima sesión.'}
        </p>
      </div>
    )
  }

  const latestUpdate = updates[updates.length - 1]

  return (
    <div className="flex flex-col gap-6">
      {/* Patient toggle switch */}
      {!isProfessional && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-sm text-foreground">Ver mi progreso</span>
              {'recommendation' in view && view.recommendation && (
                <span className="text-xs text-muted-foreground">
                  Recomendación de tu profesional: {view.recommendation === 'show' ? 'Recomienda revisar el avance' : 'Recomienda no obsesionarse con los números'}
                </span>
              )}
            </div>
            <Switch
              checked={wantsToSee}
              onCheckedChange={handleToggleVisibility}
            />
          </CardContent>
        </Card>
      )}

      {/* Main Progress Display */}
      {(isProfessional || wantsToSee) && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-foreground">Estado de avance terapéutico</CardTitle>
                <Badge variant="outline" className="text-xs capitalize">
                  Formato: {settings.format}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* Visual Stage Progress */}
              {settings.stages && settings.stages.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    {settings.stages.map((stg, idx) => {
                      const isCurrent = latestUpdate && parseFloat(latestUpdate.value) >= idx
                      return (
                        <span
                          key={stg}
                          className={isCurrent ? 'text-primary font-semibold' : ''}
                        >
                          {stg}
                        </span>
                      )
                    })}
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden flex">
                    {settings.stages.map((stg, idx) => {
                      const isFilled = latestUpdate && parseFloat(latestUpdate.value) >= idx
                      return (
                        <div
                          key={stg}
                          className={`flex-1 border-r border-background transition-colors ${
                            isFilled ? 'bg-primary' : 'bg-surface-2'
                          }`}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Latest milestone note */}
              {latestUpdate && latestUpdate.note && (
                <div className="rounded-lg bg-surface-2 p-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground block mb-0.5">Última actualización:</span>
                  <p>{latestUpdate.note}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional: Add update form */}
          {isProfessional && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-foreground">Registrar actualización de progreso</CardTitle>
              </CardHeader>
              <form onSubmit={handleAddUpdate}>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">
                      Nivel / Etapa (0 a {settings.stages ? settings.stages.length - 1 : 100})
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newVal}
                      onChange={(e) => setNewVal(e.target.value)}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-foreground">Nota de hito (opcional)</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ej: Consolidación de herramientas de autorregulación..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                      />
                      <Button type="submit" size="sm" disabled={loading || !newVal}>
                        Registrar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </form>
            </Card>
          )}

          {/* Updates List */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Historial de actualizaciones</h3>
            {updates.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No hay registros de progreso aún.</p>
            ) : (
              updates.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface-1 p-3 text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      Valor: {u.value}
                      {settings.stages && settings.stages[Math.round(parseFloat(u.value))]
                        ? ` (${settings.stages[Math.round(parseFloat(u.value))]})`
                        : ''}
                    </span>
                    {u.note && <span className="text-muted-foreground">{u.note}</span>}
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString('es-AR')}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
