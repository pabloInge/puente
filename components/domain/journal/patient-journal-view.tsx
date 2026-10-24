'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'
import { Textarea } from '@/components/ui/textarea'

type JournalItem = {
  id: string
  kind: 'conflict' | 'need' | 'other'
  body: string
  mood: number | null
  weekStart: string
  editableUntil: Date | string
  readByProfessionalAt: Date | string | null
  createdAt: Date | string
  canEdit: boolean
}

const moodEmojis: Record<number, string> = {
  1: '😫 Muy mal',
  2: '😕 Mal',
  3: '😐 Regular',
  4: '🙂 Bien',
  5: '😄 Muy bien',
}

export function PatientJournalView({
  entries,
  hasBond,
}: {
  entries: JournalItem[]
  hasBond: boolean
}) {
  const router = useRouter()
  const [kind, setKind] = useState<'conflict' | 'need' | 'other'>('conflict')
  const [body, setBody] = useState('')
  const [mood, setMood] = useState<number | null>(3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/journal/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, body: body.trim(), mood }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al guardar entrada')
      setBody('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!hasBond) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        El diario personal está disponible cuando tenés un vínculo terapéutico activo con un profesional.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Quick Entry Box (Mobile First) */}
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground">¿Qué querés registrar hoy?</CardTitle>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setKind('conflict')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  kind === 'conflict'
                    ? 'bg-destructive/15 text-destructive border border-destructive/30'
                    : 'bg-surface-2 text-muted-foreground hover:bg-muted'
                }`}
              >
                Conflicto / Crisis
              </button>
              <button
                type="button"
                onClick={() => setKind('need')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  kind === 'need'
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'bg-surface-2 text-muted-foreground hover:bg-muted'
                }`}
              >
                Necesidad
              </button>
              <button
                type="button"
                onClick={() => setKind('other')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  kind === 'other'
                    ? 'bg-secondary text-secondary-foreground border border-border'
                    : 'bg-surface-2 text-muted-foreground hover:bg-muted'
                }`}
              >
                Reflexión / Otro
              </button>
            </div>

            <Textarea
              placeholder="Escribí lo que sentís, lo que pasó o lo que necesitás conversar en la próxima sesión..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={4}
            />

            <div className="flex items-center gap-3 text-xs">
              <span className="font-medium text-foreground">Estado de ánimo:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMood(val)}
                    className={`size-8 rounded-full text-xs font-medium transition-colors ${
                      mood === val
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                        : 'bg-surface-2 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              {mood && <span className="text-muted-foreground ml-2">{moodEmojis[mood]}</span>}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading || !body.trim()}>
                <Icon icon={icons.Send} size="sm" data-icon="inline-start" />
                {loading ? 'Guardando...' : 'Registrar en mi diario'}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Entries List */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-foreground">Entradas registradas</h2>

        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No tenés entradas en el diario aún. Registrá lo que te pasa entre sesiones para trabajarlo con tu profesional.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        entry.kind === 'conflict'
                          ? 'destructive'
                          : entry.kind === 'need'
                            ? 'default'
                            : 'secondary'
                      }
                      className="text-xs capitalize"
                    >
                      {entry.kind === 'conflict' ? 'Conflicto' : entry.kind === 'need' ? 'Necesidad' : 'Otro'}
                    </Badge>
                    {entry.mood && (
                      <span className="text-xs text-muted-foreground">{moodEmojis[entry.mood]}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(entry.createdAt).toLocaleDateString('es-AR')}</span>
                    {entry.readByProfessionalAt ? (
                      <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        Leído por tu profesional
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        No leído aún
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {entry.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
