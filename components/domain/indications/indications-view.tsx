'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type IndicationItem = {
  id: string
  title: string
  description: string | null
  kind: 'guideline' | 'exercise' | 'reading' | 'other'
  frequency: string | null
  validUntil: string | null
  status: 'active' | 'archived'
  patientSeenAt: Date | string | null
  createdAt: Date | string
  comments: { id: string; authorName: string; body: string; createdAt: Date | string }[]
  resources: { id: string; name: string; url: string; type: string }[]
}

export function IndicationsView({
  bondId,
  indications,
  isProfessional,
}: {
  bondId: string
  indications: IndicationItem[]
  isProfessional: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [commentingId, setCommentingId] = useState<string | null>(null)
  const [commentBody, setCommentBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New Indication Form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<'guideline' | 'exercise' | 'reading' | 'other'>('guideline')
  const [frequency, setFrequency] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/indications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bondId,
          title,
          description,
          kind,
          frequency,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al crear indicación')
      setOpen(false)
      setTitle('')
      setDescription('')
      setFrequency('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleArchive(id: string) {
    if (!confirm('¿Archivar esta indicación?')) return
    try {
      await fetch('/api/indications/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicationId: id }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentingId || !commentBody.trim()) return
    setLoading(true)
    try {
      await fetch('/api/indications/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indicationId: commentingId,
          body: commentBody.trim(),
        }),
      })
      setCommentingId(null)
      setCommentBody('')
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Indicaciones y recursos</h2>
          <p className="text-sm text-muted-foreground">
            Pautas de trabajo, ejercicios entre sesiones y lecturas recomendadas.
          </p>
        </div>

        {isProfessional && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Icon icon={icons.Plus} size="sm" data-icon="inline-start" />
            Nueva indicación
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {indications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No hay indicaciones registradas aún para este paciente.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {indications.map((ind) => (
            <Card key={ind.id} className={ind.status === 'archived' ? 'opacity-70' : ''}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base text-foreground">{ind.title}</CardTitle>
                    <Badge variant={ind.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {ind.status === 'active' ? 'Vigente' : 'Archivada'}
                    </Badge>
                  </div>
                  {ind.frequency && (
                    <p className="text-xs text-muted-foreground mt-0.5">Frecuencia: {ind.frequency}</p>
                  )}
                </div>

                {isProfessional && ind.status === 'active' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchive(ind.id)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Archivar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                {ind.description && (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {ind.description}
                  </p>
                )}

                {ind.resources.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ind.resources.map((r) => (
                      <a
                        key={r.id}
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-primary hover:underline"
                      >
                        <Icon icon={icons.ExternalLink} size="sm" />
                        {r.name}
                      </a>
                    ))}
                  </div>
                )}

                {/* Comments section */}
                {ind.comments.length > 0 && (
                  <div className="mt-2 space-y-2 border-t border-border pt-2 text-xs">
                    <span className="font-semibold text-foreground">Comentarios y dudas:</span>
                    {ind.comments.map((c) => (
                      <div key={c.id} className="rounded bg-surface-2 p-2">
                        <span className="font-medium text-foreground">{c.authorName}: </span>
                        <span className="text-muted-foreground">{c.body}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end border-t border-border pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCommentingId(ind.id)}
                  className="text-xs"
                >
                  <Icon icon={icons.MessageSquare} size="sm" data-icon="inline-start" />
                  Agregar comentario
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* New Indication Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva indicación para el paciente</DialogTitle>
            <DialogDescription>
              Asigná tareas, ejercicios o pautas para acompañar el proceso terapéutico.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Título</label>
              <Input
                placeholder="Ej: Ejercicio de respiración diafragmática"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Descripción o consigna</label>
              <Textarea
                placeholder="Detallá los pasos o recomendaciones..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Tipo</label>
                <select
                  aria-label="Tipo"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as any)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="exercise">Ejercicio</option>
                  <option value="guideline">Pauta / Guía</option>
                  <option value="reading">Lectura</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Frecuencia recomendada</label>
                <Input
                  placeholder="Ej: Diario antes de dormir"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Asignar indicación'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={Boolean(commentingId)} onOpenChange={(o) => !o && setCommentingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comentar sobre la indicación</DialogTitle>
            <DialogDescription>
              Anotá tus dudas o cómo te fue realizando esta actividad.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleComment} className="flex flex-col gap-4">
            <Textarea
              placeholder="Escribí tu comentario..."
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              required
              rows={3}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCommentingId(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Comentar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
