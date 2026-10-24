'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type JournalItem = {
  id: string
  kind: 'conflict' | 'need' | 'other'
  body: string
  mood: number | null
  weekStart: string
  readByProfessionalAt: Date | string | null
  createdAt: Date | string
}

const moodEmojis: Record<number, string> = {
  1: '😫 Muy mal',
  2: '😕 Mal',
  3: '😐 Regular',
  4: '🙂 Bien',
  5: '😄 Muy bien',
}

export function ProfessionalJournalView({
  entries,
}: {
  entries: JournalItem[]
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Diario del paciente</h2>
        <p className="text-sm text-muted-foreground">
          Anotaciones de reflexiones, necesidades y conflictos registradas por el paciente entre sesiones.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          El paciente no ha registrado entradas en su diario aún.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
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
                <span className="text-xs text-muted-foreground">
                  Semana del {entry.weekStart} · {new Date(entry.createdAt).toLocaleDateString('es-AR')}
                </span>
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
  )
}
