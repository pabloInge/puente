'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'
import { Switch } from '@/components/ui/switch'

type WeeklySummaryItem = {
  id: string
  weekStart: string
  data: any
  aiText: string | null
  professionalAnnotation: string | null
  sharedWithPatient: boolean
  createdAt: Date | string
}

type WeeklySummaryViewProps = {
  bondId: string
  isProfessional: boolean
  summaries: WeeklySummaryItem[]
}

export function WeeklySummaryView({
  bondId,
  isProfessional,
  summaries,
}: WeeklySummaryViewProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [annotation, setAnnotation] = useState('')
  const [shared, setShared] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  function startEdit(item: WeeklySummaryItem) {
    setEditingId(item.id)
    setAnnotation(item.professionalAnnotation ?? '')
    setShared(item.sharedWithPatient)
  }

  async function handleSaveAnnotation(summaryId: string) {
    setLoading(true)
    try {
      await fetch('/api/summaries/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'annotate',
          summaryId,
          annotation,
          shareWithPatient: shared,
        }),
      })
      setEditingId(null)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateCurrent() {
    setGenerating(true)
    try {
      const now = new Date()
      const day = now.getUTCDay()
      const diffToMonday = (day + 6) % 7
      const monday = new Date(now)
      monday.setUTCDate(now.getUTCDate() - diffToMonday)
      const weekStart = monday.toISOString().slice(0, 10)

      await fetch('/api/summaries/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          bondId,
          weekStart,
        }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Resúmenes semanales</h2>
          <p className="text-sm text-muted-foreground">
            {isProfessional
              ? 'Consolidados de actividad para revisión clínica, anotaciones y devolución al paciente.'
              : 'Resúmenes compartidos de tu proceso terapéutico semana a semana.'}
          </p>
        </div>
        {isProfessional && (
          <Button
            onClick={handleGenerateCurrent}
            disabled={generating}
            className="flex items-center gap-2"
          >
            <Icon icon={icons.Sparkles} size="sm" />
            {generating ? 'Generando...' : 'Redactar semana con IA'}
          </Button>
        )}
      </div>

      {summaries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <span className="flex size-12 items-center justify-center rounded-full bg-surface-2 mb-3">
              <Icon icon={icons.Calendar} size="md" />
            </span>
            <p className="font-medium text-foreground">No hay resúmenes semanales todavía</p>
            <p className="text-xs mt-1 max-w-sm">
              {isProfessional
                ? 'Los resúmenes se generan automáticamente cada lunes o podés forzar la redacción de la semana actual.'
                : 'Tu profesional compartirá los resúmenes y notas cuando estén listos.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {summaries.map((item) => {
            const isEditing = editingId === item.id
            const metrics = item.data

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-3 bg-surface-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">
                      Semana del {item.weekStart}
                    </CardTitle>
                    {item.sharedWithPatient ? (
                      <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300">
                        Compartido con paciente
                      </Badge>
                    ) : (
                      isProfessional && (
                        <Badge variant="secondary">Privado</Badge>
                      )
                    )}
                  </div>
                  {isProfessional && !isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                      Editar anotación
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-4 flex flex-col gap-4">
                  {/* Aggregated indicators */}
                  {metrics && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="rounded border border-border p-2 bg-surface-2/40">
                        <span className="text-muted-foreground block">Diario</span>
                        <span className="font-semibold">{metrics.journal?.total ?? 0} entradas</span>
                      </div>
                      <div className="rounded border border-border p-2 bg-surface-2/40">
                        <span className="text-muted-foreground block">Ánimo prom.</span>
                        <span className="font-semibold">
                          {metrics.journal?.averageMood ? `${metrics.journal.averageMood}/5` : 'S/D'}
                        </span>
                      </div>
                      <div className="rounded border border-border p-2 bg-surface-2/40">
                        <span className="text-muted-foreground block">Indicaciones</span>
                        <span className="font-semibold">
                          {metrics.indications?.seen ?? 0} vistas
                        </span>
                      </div>
                      <div className="rounded border border-border p-2 bg-surface-2/40">
                        <span className="text-muted-foreground block">Turnos</span>
                        <span className="font-semibold">
                          {metrics.appointments?.completed ?? 0} realizados
                        </span>
                      </div>
                    </div>
                  )}

                  {/* AI Draft */}
                  {item.aiText && (
                    <div className="rounded-md border border-border bg-surface-2/30 p-3 text-sm text-foreground">
                      <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-1.5">
                        <Icon icon={icons.Sparkles} size="sm" />
                        <span>Síntesis clínica generada por IA</span>
                      </div>
                      <p className="whitespace-pre-wrap">{item.aiText}</p>
                    </div>
                  )}

                  {/* Professional Annotation & Share Controls */}
                  {isEditing ? (
                    <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <label className="text-xs font-semibold text-foreground">
                        Anotación y observaciones profesionales:
                      </label>
                      <textarea
                        value={annotation}
                        onChange={(e) => setAnnotation(e.target.value)}
                        placeholder="Escribí aquí tus observaciones clínicas o devolución para el paciente..."
                        rows={3}
                        className="w-full rounded-md border border-border bg-background p-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                          <Switch checked={shared} onCheckedChange={setShared} />
                          <span>Compartir este resumen y anotación con el paciente</span>
                        </label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(null)}
                            disabled={loading}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveAnnotation(item.id)}
                            disabled={loading}
                          >
                            {loading ? 'Guardando...' : 'Guardar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : item.professionalAnnotation ? (
                    <div className="rounded-md border border-border bg-surface-1 p-3 text-sm">
                      <span className="text-xs font-semibold text-muted-foreground block mb-1">
                        Devolución / Notas del profesional:
                      </span>
                      <p className="whitespace-pre-wrap text-foreground">
                        {item.professionalAnnotation}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
