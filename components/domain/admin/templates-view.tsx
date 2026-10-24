'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Icon, icons } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'

type Template = {
  id: string
  name: string
  entryKind: 'starting_point' | 'first_impressions' | 'evolution' | 'amendment'
  sections: { title: string; hint?: string }[]
}

const KIND_NAMES = {
  starting_point: 'Punto de inicio',
  first_impressions: 'Primeras impresiones',
  evolution: 'Nota de evolución',
  amendment: 'Enmienda',
}

export function GlobalTemplatesView({ templates }: { templates: Template[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [name, setName] = useState('')
  const [entryKind, setEntryKind] = useState<Template['entryKind']>('evolution')
  const [sections, setSections] = useState<{ title: string; hint?: string }[]>([
    { title: 'Motivo y estado actual', hint: 'Descripción del paciente' },
  ])
  const [loading, setLoading] = useState(false)

  function openCreate() {
    setEditing(null)
    setName('')
    setEntryKind('evolution')
    setSections([{ title: 'Motivo / Temas abordados', hint: '' }])
    setOpen(true)
  }

  function openEdit(t: Template) {
    setEditing(t)
    setName(t.name)
    setEntryKind(t.entryKind)
    setSections(t.sections.length > 0 ? t.sections : [{ title: 'Sección', hint: '' }])
    setOpen(true)
  }

  function addSection() {
    setSections([...sections, { title: '', hint: '' }])
  }

  function removeSection(idx: number) {
    setSections(sections.filter((_, i) => i !== idx))
  }

  function updateSection(idx: number, field: 'title' | 'hint', val: string) {
    const updated = [...sections]
    updated[idx] = { ...updated[idx], [field]: val }
    setSections(updated)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) {
        await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            id: editing.id,
            data: { name, entryKind, sections },
          }),
        })
      } else {
        await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            data: { name, entryKind, sections },
          }),
        })
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta plantilla global?')) return
    try {
      await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      })
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Plantillas clínicas globales</h2>
          <p className="text-sm text-muted-foreground">
            Estructuras predefinidas disponibles para todos los profesionales de la plataforma (CU-G-04).
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Icon icon={icons.Plus} size="sm" />
          Nueva plantilla global
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">{t.name}</CardTitle>
                <Badge variant="outline">{KIND_NAMES[t.entryKind]}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700">
                  Borrar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2 flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Secciones incluidas:</span>
              <div className="flex flex-col gap-1.5">
                {t.sections.map((s, idx) => (
                  <div key={idx} className="rounded bg-surface-1 p-2 text-xs border border-border">
                    <span className="font-semibold text-foreground block">{s.title}</span>
                    {s.hint && <span className="text-muted-foreground text-[11px]">{s.hint}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar plantilla global' : 'Nueva plantilla global'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Nombre</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Tipo de asiento</label>
                <select
                  value={entryKind}
                  onChange={(e) => setEntryKind(e.target.value as any)}
                  className="w-full rounded-md border border-border bg-background p-2 text-sm"
                >
                  <option value="evolution">Nota de evolución</option>
                  <option value="starting_point">Punto de inicio</option>
                  <option value="first_impressions">Primeras impresiones</option>
                  <option value="amendment">Enmienda</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-foreground">Secciones de la plantilla</label>
                <Button type="button" variant="outline" size="sm" onClick={addSection}>
                  + Agregar sección
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {sections.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 border border-border rounded p-2 bg-surface-1">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        value={s.title}
                        onChange={(e) => updateSection(idx, 'title', e.target.value)}
                        placeholder="Título de la sección"
                        required
                      />
                      <Input
                        value={s.hint ?? ''}
                        onChange={(e) => updateSection(idx, 'hint', e.target.value)}
                        placeholder="Guía o sugerencia clínica"
                      />
                    </div>
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(idx)}
                        className="text-red-500 hover:text-red-700 text-sm px-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar plantilla'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
