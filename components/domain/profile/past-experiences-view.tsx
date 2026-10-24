'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type PastExperienceItem = {
  id: string
  periodFrom: string | null
  periodTo: string | null
  reason: string | null
  outcome: string | null
  professionalName: string | null
  externalProfessionalName: string | null
  closingSummaryId: string | null
}

export function PastExperiencesView({
  experiences,
}: {
  experiences: PastExperienceItem[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    externalProfessionalName: '',
    periodFrom: '',
    periodTo: '',
    reason: '',
    outcome: '',
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/patient/past-experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al guardar la experiencia.')
      setOpen(false)
      setForm({
        externalProfessionalName: '',
        periodFrom: '',
        periodTo: '',
        reason: '',
        outcome: '',
      })
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Seguro que querés eliminar este registro?')) return
    try {
      await fetch(`/api/patient/past-experiences?id=${id}`, { method: 'DELETE' })
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Tratamientos anteriores</h2>
          <p className="text-sm text-muted-foreground">
            Registros de procesos terapéuticos previos dentro o fuera de la plataforma.
          </p>
        </div>

        <Button size="sm" onClick={() => setOpen(true)}>
          <Icon icon={icons.Plus} size="sm" data-icon="inline-start" />
          Agregar experiencia
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar experiencia previa</DialogTitle>
              <DialogDescription>
                Anotá con quién te atendiste y cuáles fueron los motivos principales de ese proceso.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Nombre del profesional o institución
                </label>
                <Input
                  value={form.externalProfessionalName}
                  onChange={(e) => setForm({ ...form, externalProfessionalName: e.target.value })}
                  placeholder="Ej: Lic. Gómez / Hospital..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Desde</label>
                  <Input
                    type="date"
                    value={form.periodFrom}
                    onChange={(e) => setForm({ ...form, periodFrom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Hasta</label>
                  <Input
                    type="date"
                    value={form.periodTo}
                    onChange={(e) => setForm({ ...form, periodTo: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Motivo de consulta</label>
                <Textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="¿Por qué consultaste en ese momento?"
                  required
                  rows={3}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Resultado o motivo de fin (opcional)</label>
                <Textarea
                  value={form.outcome}
                  onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                  placeholder="Ej: Alta por objetivos cumplidos / mudanza..."
                  rows={2}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {experiences.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No tenés experiencias previas registradas. Podés agregar procesos terapéuticos anteriores para tener tu historial ordenado.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {experiences.map((exp) => (
            <Card key={exp.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base text-foreground">
                    {exp.professionalName ?? exp.externalProfessionalName ?? 'Profesional no especificado'}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {exp.periodFrom ? `Desde ${exp.periodFrom}` : ''}
                    {exp.periodTo ? ` hasta ${exp.periodTo}` : ' (en curso o sin fecha de fin)'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(exp.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Icon icon={icons.Trash2} size="sm" />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div>
                  <span className="font-medium text-foreground">Motivo: </span>
                  <span className="text-muted-foreground">{exp.reason ?? 'Sin motivo especificado'}</span>
                </div>
                {exp.outcome && (
                  <div>
                    <span className="font-medium text-foreground">Desenlace: </span>
                    <span className="text-muted-foreground">{exp.outcome}</span>
                  </div>
                )}
                {exp.closingSummaryId && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-primary font-medium">
                    <Icon icon={icons.FileText} size="sm" />
                    Cuenta con resumen de cierre adjunto
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
