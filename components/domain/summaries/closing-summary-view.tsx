'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'

type ClosingSummaryViewProps = {
  bondId: string
  isProfessional: boolean
  isBroken: boolean
  summary: {
    id: string
    status: 'requested' | 'draft' | 'approved'
    content: string | null
    requestedByPatientAt: Date | string | null
    approvedAt: Date | string | null
  } | null
}

export function ClosingSummaryView({
  bondId,
  isProfessional,
  isBroken,
  summary,
}: ClosingSummaryViewProps) {
  const router = useRouter()
  const [content, setContent] = useState(summary?.content ?? '')
  const [loading, setLoading] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [attached, setAttached] = useState(false)

  const isApproved = summary?.status === 'approved'

  async function handleRequest() {
    setLoading(true)
    try {
      await fetch('/api/summaries/closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', bondId }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateDraft() {
    setDrafting(true)
    try {
      const res = await fetch('/api/summaries/closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'draft', bondId }),
      })
      const data = await res.json()
      if (data.draft) setContent(data.draft)
    } catch (err) {
      console.error(err)
    } finally {
      setDrafting(false)
    }
  }

  async function handleSaveDraft() {
    setLoading(true)
    try {
      await fetch('/api/summaries/closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_draft', bondId, content }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    if (!confirm('¿Aprobar el resumen de cierre? Una vez aprobado, será inmutable (R-04) y accesible para el paciente.')) {
      return
    }
    setLoading(true)
    try {
      await fetch('/api/summaries/closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', bondId, content }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAttachToExperience() {
    if (!summary?.id) return
    setLoading(true)
    try {
      await fetch('/api/summaries/closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'attach', bondId, summaryId: summary.id }),
      })
      setAttached(true)
      router.refresh()
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
          <h2 className="text-xl font-semibold text-foreground">Resumen de cierre</h2>
          <p className="text-sm text-muted-foreground">
            Documento final de cierre de tratamiento y síntesis diagnóstica/evolutiva (R-13).
          </p>
        </div>
        {isApproved && (
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="flex items-center gap-2"
          >
            <Icon icon={icons.FileText} size="sm" />
            Descargar / Imprimir
          </Button>
        )}
      </div>

      {/* Status banner */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface-1 p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-foreground">
            <Icon icon={icons.Check} size="md" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Estado del resumen:</span>
              {isApproved ? (
                <Badge className="bg-emerald-600 text-white">Aprobado e inmutable</Badge>
              ) : summary?.status === 'requested' ? (
                <Badge variant="secondary">Solicitado por el paciente</Badge>
              ) : summary?.status === 'draft' ? (
                <Badge variant="outline">Borrador en edición</Badge>
              ) : (
                <Badge variant="outline">Sin solicitar</Badge>
              )}
            </div>
            {summary?.approvedAt && (
              <span className="text-xs text-muted-foreground block mt-0.5">
                Aprobado el {new Date(summary.approvedAt).toLocaleDateString('es-AR')}
              </span>
            )}
          </div>
        </div>

        {/* Patient action: Request if not requested */}
        {!isProfessional && !summary && (
          <Button onClick={handleRequest} disabled={loading}>
            Solicitar resumen de cierre
          </Button>
        )}

        {/* Patient action: Attach to past experiences */}
        {!isProfessional && isApproved && (
          <Button
            onClick={handleAttachToExperience}
            disabled={loading || attached}
            variant="secondary"
          >
            {attached ? 'Adjuntado a mi historial' : 'Adjuntar a mis antecedentes'}
          </Button>
        )}
      </div>

      {/* Editor or Content view */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Contenido del documento</CardTitle>
          {isProfessional && !isApproved && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateDraft}
              disabled={drafting}
              className="flex items-center gap-1.5"
            >
              <Icon icon={icons.Sparkles} size="sm" />
              {drafting ? 'Cargando borrador...' : 'Precargar borrador con IA'}
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-2 flex flex-col gap-4">
          {isProfessional && !isApproved ? (
            <div className="flex flex-col gap-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Redactá el resumen de cierre del tratamiento: objetivos alcanzados, motivos de finalización y recomendaciones..."
                rows={12}
                className="w-full rounded-md border border-border bg-background p-3 text-sm font-sans outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
                  Guardar borrador
                </Button>
                <Button onClick={handleApprove} disabled={loading || !content.trim()}>
                  Aprobar definitivamente (Inmutable)
                </Button>
              </div>
            </div>
          ) : isApproved || content ? (
            <div className="rounded-md border border-border bg-surface-1 p-6 text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
              {content || summary?.content}
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground text-sm">
              El resumen de cierre aún no fue redactado por el profesional.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
