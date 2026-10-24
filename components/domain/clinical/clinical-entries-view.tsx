'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Icon, icons } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type EntryItem = {
  id: string
  kind: 'starting_point' | 'first_impressions' | 'evolution' | 'amendment'
  amendsEntryId: string | null
  content: { title: string; body: string }[]
  contentHash: string
  authorLicenseSnapshot: string | null
  createdAt: Date | string
  isTampered: boolean
}

type TemplateItem = {
  id: string
  name: string
  entryKind: string
  sections: { title: string; hint?: string }[]
}

export function ClinicalEntriesView({
  bondId,
  entries,
  templates,
}: {
  bondId: string
  entries: EntryItem[]
  templates: TemplateItem[]
}) {
  const router = useRouter()
  const [newOpen, setNewOpen] = useState(false)
  const [amendOpen, setAmendOpen] = useState<string | null>(null)
  const [kind, setKind] = useState<'starting_point' | 'first_impressions' | 'evolution'>('evolution')
  const [sections, setSections] = useState([{ title: 'Temas trabajados', body: '' }, { title: 'Intervenciones', body: '' }])
  const [amendSections, setAmendSections] = useState([{ title: 'Aclaración / Enmienda', body: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function applyTemplate(tplId: string) {
    const tpl = templates.find((t) => t.id === tplId)
    if (!tpl) return
    setSections(tpl.sections.map((s) => ({ title: s.title, body: '' })))
  }

  function addSection() {
    setSections((prev) => [...prev, { title: '', body: '' }])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/clinical/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bondId,
          kind,
          content: sections,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al guardar entrada')
      setNewOpen(false)
      setSections([{ title: 'Temas trabajados', body: '' }, { title: 'Intervenciones', body: '' }])
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAmend(e: React.FormEvent) {
    e.preventDefault()
    if (!amendOpen) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/clinical/amend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bondId,
          amendsEntryId: amendOpen,
          content: amendSections,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al guardar enmienda')
      setAmendOpen(null)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Registro Clínico</h2>
          <p className="text-sm text-muted-foreground">
            Entradas inmutables protegidas por hash criptográfico SHA-256 (R-04).
          </p>
        </div>

        <Button size="sm" onClick={() => setNewOpen(true)}>
          <Icon icon={icons.Plus} size="sm" data-icon="inline-start" />
          Nueva entrada clínica
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No hay entradas clínicas registradas para este vínculo todavía.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => {
            const isAmendment = entry.kind === 'amendment'

            return (
              <Card
                key={entry.id}
                className={isAmendment ? 'border-amber-500/40 bg-amber-500/5' : ''}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base text-foreground capitalize">
                        {entry.kind === 'starting_point'
                          ? 'Punto de inicio'
                          : entry.kind === 'first_impressions'
                            ? 'Primeras impresiones'
                            : entry.kind === 'evolution'
                              ? 'Nota de evolución'
                              : 'Enmienda vinculada'}
                      </CardTitle>
                      <Badge
                        variant={entry.isTampered ? 'destructive' : 'outline'}
                        className="text-[11px]"
                      >
                        {entry.isTampered ? '¡Hash alterado!' : 'SHA-256 íntegro'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      · Matrícula autor: {entry.authorLicenseSnapshot ?? 'Registrada'}
                    </p>
                  </div>

                  {!isAmendment && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAmendOpen(entry.id)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Icon icon={icons.FileEdit} size="sm" data-icon="inline-start" />
                      Enmendar
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  {entry.content.map((sec, idx) => (
                    <div key={idx} className="rounded-md bg-surface-2 p-3">
                      <span className="font-semibold text-foreground text-xs block mb-1">
                        {sec.title}
                      </span>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {sec.body}
                      </p>
                    </div>
                  ))}
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span className="truncate max-w-sm">Hash: {entry.contentHash}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* New Entry Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva entrada en historia clínica</DialogTitle>
            <DialogDescription>
              Las notas son inmutables tras su guardado. Si requiere modificaciones posteriores, se aplicará una enmienda vinculada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Tipo de entrada</label>
                <select
                  aria-label="Tipo de entrada"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as any)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="evolution">Nota de evolución</option>
                  <option value="starting_point">Punto de inicio</option>
                  <option value="first_impressions">Primeras impresiones</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Plantilla rápida</label>
                <select
                  aria-label="Plantilla rápida"
                  onChange={(e) => applyTemplate(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Aplicar plantilla...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Secciones de la nota</span>
                <Button type="button" variant="outline" size="sm" onClick={addSection}>
                  + Agregar sección
                </Button>
              </div>

              {sections.map((sec, idx) => (
                <div key={idx} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                  <Input
                    placeholder="Título de la sección (ej: Temas trabajados, Hipótesis...)"
                    value={sec.title}
                    onChange={(e) => {
                      const updated = [...sections]
                      updated[idx].title = e.target.value
                      setSections(updated)
                    }}
                    required
                  />
                  <Textarea
                    placeholder="Contenido..."
                    value={sec.body}
                    onChange={(e) => {
                      const updated = [...sections]
                      updated[idx].body = e.target.value
                      setSections(updated)
                    }}
                    required
                    rows={3}
                  />
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Firmar y registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Amendment Dialog */}
      <Dialog open={Boolean(amendOpen)} onOpenChange={(o) => !o && setAmendOpen(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Enmendar entrada clínica</DialogTitle>
            <DialogDescription>
              La enmienda quedará vinculada permanentemente a la entrada original para preservar la trazabilidad médica.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAmend} className="flex flex-col gap-4">
            <Textarea
              placeholder="Describí la aclaración o rectificación..."
              value={amendSections[0].body}
              onChange={(e) => setAmendSections([{ title: 'Enmienda', body: e.target.value }])}
              required
              rows={4}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAmendOpen(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Firmando enmienda...' : 'Registrar enmienda'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
