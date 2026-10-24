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

type TemplateItem = {
  id: string
  name: string
  entryKind: 'starting_point' | 'first_impressions' | 'evolution' | 'amendment'
  ownerProfessionalId: string | null
  sections: { title: string; hint?: string }[]
}

export function ClinicalTemplatesView({
  templates,
}: {
  templates: TemplateItem[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [entryKind, setEntryKind] = useState<'starting_point' | 'first_impressions' | 'evolution'>('evolution')
  const [sections, setSections] = useState([{ title: '', hint: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addSection() {
    setSections((prev) => [...prev, { title: '', hint: '' }])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/clinical/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          entryKind,
          sections: sections.filter((s) => s.title.trim().length > 0),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al crear plantilla')
      setOpen(false)
      setName('')
      setSections([{ title: '', hint: '' }])
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
          <h2 className="text-xl font-semibold text-foreground">Plantillas de notas clínicas</h2>
          <p className="text-sm text-muted-foreground">
            Estructuras predefinidas para agilizar el registro y estandarizar tus anotaciones.
          </p>
        </div>

        <Button size="sm" onClick={() => setOpen(true)}>
          <Icon icon={icons.Plus} size="sm" data-icon="inline-start" />
          Nueva plantilla propia
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-base text-foreground">{t.name}</CardTitle>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                  Tipo: {t.entryKind.replace('_', ' ')}
                </p>
              </div>
              <Badge variant={t.ownerProfessionalId ? 'default' : 'secondary'} className="text-xs">
                {t.ownerProfessionalId ? 'Propia' : 'Global de Puente'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Secciones:</span>
                <ul className="list-inside list-disc">
                  {t.sections.map((s, idx) => (
                    <li key={idx}>
                      <span className="font-medium text-foreground">{s.title}</span>
                      {s.hint && <span className="text-muted-foreground ml-1">({s.hint})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Template Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Crear plantilla de nota clínica</DialogTitle>
            <DialogDescription>
              Definí el nombre y las secciones que compondrán tu plantilla.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Nombre de la plantilla</label>
              <Input
                placeholder="Ej: Evolución TCC breve"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Tipo de entrada a la que aplica</label>
              <select
                aria-label="Tipo de entrada a la que aplica"
                value={entryKind}
                onChange={(e) => setEntryKind(e.target.value as any)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="evolution">Nota de evolución</option>
                <option value="starting_point">Punto de inicio</option>
                <option value="first_impressions">Primeras impresiones</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Secciones</span>
                <Button type="button" variant="outline" size="sm" onClick={addSection}>
                  + Agregar
                </Button>
              </div>

              {sections.map((sec, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder="Título (ej: Objetivos)"
                    value={sec.title}
                    onChange={(e) => {
                      const updated = [...sections]
                      updated[idx].title = e.target.value
                      setSections(updated)
                    }}
                    required
                  />
                  <Input
                    placeholder="Pista / Ayuda (opcional)"
                    value={sec.hint}
                    onChange={(e) => {
                      const updated = [...sections]
                      updated[idx].hint = e.target.value
                      setSections(updated)
                    }}
                  />
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creando...' : 'Guardar plantilla'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
