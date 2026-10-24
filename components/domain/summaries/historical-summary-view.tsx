'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'

type HistoricalSummaryViewProps = {
  bondId: string
  isProfessional: boolean
  startingPoint: string | null
  weeksCount: number
  progressCount: number
  progressPoints: { at: string; label: string; value: number | null }[]
}

export function HistoricalSummaryView({
  bondId,
  isProfessional,
  startingPoint,
  weeksCount,
  progressCount,
  progressPoints,
}: HistoricalSummaryViewProps) {
  const [aiDraft, setAiDraft] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleDraftAi() {
    setLoading(true)
    try {
      const res = await fetch('/api/summaries/historic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bondId }),
      })
      const data = await res.json()
      if (data.draft) setAiDraft(data.draft)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Resumen histórico</h2>
          <p className="text-sm text-muted-foreground">
            Visión global del vínculo terapéutico: punto de partida, hitos y evolución consolidada.
          </p>
        </div>
        {isProfessional && (
          <Button
            onClick={handleDraftAi}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Icon icon={icons.Sparkles} size="sm" />
            {loading ? 'Generando...' : 'Redactar síntesis histórica con IA'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Starting Point Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon icon={icons.Flag} size="sm" className="text-primary" />
              Punto de inicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {startingPoint ? (
              <p className="text-sm text-foreground whitespace-pre-wrap">{startingPoint}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No se ha registrado aún el motivo inicial o primera impresión en la historia clínica.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Accumulated Metrics Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon icon={icons.TrendingUp} size="sm" className="text-primary" />
              Trayectoria acumulada
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-border p-3 bg-surface-1">
                <span className="text-2xl font-bold text-foreground">{weeksCount}</span>
                <span className="text-xs text-muted-foreground block mt-1">Semanas registradas</span>
              </div>
              <div className="rounded-lg border border-border p-3 bg-surface-1">
                <span className="text-2xl font-bold text-foreground">{progressCount}</span>
                <span className="text-xs text-muted-foreground block mt-1">Hitos de progreso</span>
              </div>
              <div className="rounded-lg border border-border p-3 bg-surface-1">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {progressPoints.length > 0 ? `${progressPoints[progressPoints.length - 1].value ?? '-'}` : '-'}
                </span>
                <span className="text-xs text-muted-foreground block mt-1">Nivel actual</span>
              </div>
            </div>

            {/* Simple milestones timeline */}
            {progressPoints.length > 0 && (
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-xs font-semibold text-muted-foreground">Hitos registrados:</span>
                <div className="flex flex-wrap gap-2">
                  {progressPoints.map((p, idx) => (
                    <div
                      key={idx}
                      className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs flex items-center gap-1.5"
                    >
                      <span className="font-semibold text-primary">{p.at}:</span>
                      <span>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Historic synthesis */}
      {aiDraft && (
        <Card className="border-primary/30">
          <CardHeader className="bg-primary/5 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
              <Icon icon={icons.Sparkles} size="sm" />
              Síntesis evolutiva global
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{aiDraft}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
