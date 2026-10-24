'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Icon, icons } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

type Branch = {
  id: string
  slug: string
  name: string
  description: string | null
  parentId: string | null
  sort: number
  active: boolean
}

export function BranchesView({ branches }: { branches: Branch[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState<string>('')
  const [sort, setSort] = useState(0)
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)

  function openCreate() {
    setEditing(null)
    setName('')
    setSlug('')
    setDescription('')
    setParentId('')
    setSort(branches.length)
    setActive(true)
    setOpen(true)
  }

  function openEdit(b: Branch) {
    setEditing(b)
    setName(b.name)
    setSlug(b.slug)
    setDescription(b.description ?? '')
    setParentId(b.parentId ?? '')
    setSort(b.sort)
    setActive(b.active)
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) {
        await fetch('/api/admin/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            id: editing.id,
            data: {
              name,
              slug,
              description: description || null,
              parentId: parentId || null,
              sort,
              active,
            },
          }),
        })
      } else {
        await fetch('/api/admin/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            data: {
              name,
              slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
              description: description || null,
              parentId: parentId || null,
              sort,
              active,
            },
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

  // Group top-level branches and subbranches
  const topBranches = branches.filter((b) => !b.parentId)
  const subBranchesMap = new Map<string, Branch[]>()
  for (const b of branches) {
    if (b.parentId) {
      const list = subBranchesMap.get(b.parentId) ?? []
      list.push(b)
      subBranchesMap.set(b.parentId, list)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Catálogo de ramas y enfoques</h2>
          <p className="text-sm text-muted-foreground">
            Especialidades, corrientes psicológicas y jerarquía de búsqueda (CU-G-01).
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Icon icon={icons.Plus} size="sm" />
          Nueva rama
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {topBranches.map((b) => {
          const subs = subBranchesMap.get(b.id) ?? []
          return (
            <Card key={b.id} className="overflow-hidden">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground text-base">{b.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">/{b.slug}</span>
                    {b.active ? (
                      <Badge variant="outline" className="text-emerald-600">Activa</Badge>
                    ) : (
                      <Badge variant="secondary">Inactiva</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">Orden: {b.sort}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>
                    Editar
                  </Button>
                </div>
                {b.description && (
                  <p className="text-xs text-muted-foreground">{b.description}</p>
                )}

                {/* Subbranches */}
                {subs.length > 0 && (
                  <div className="mt-2 pl-4 border-l-2 border-border flex flex-col gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Subramas / Enfoques:</span>
                    <div className="flex flex-wrap gap-2">
                      {subs.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => openEdit(s)}
                          className="flex items-center gap-2 rounded-md border border-border bg-surface-1 px-2.5 py-1 text-xs cursor-pointer hover:bg-surface-2 transition-colors"
                        >
                          <span className="font-medium text-foreground">{s.name}</span>
                          <span className="text-muted-foreground">({s.sort})</span>
                          {!s.active && <Badge variant="secondary" className="text-[10px]">Inactiva</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar rama' : 'Nueva rama'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4 py-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Nombre</label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!editing) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
                }}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Slug</label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Rama principal (opcional si es subrama)</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
              >
                <option value="">Ninguna (Rama principal)</option>
                {topBranches
                  .filter((t) => t.id !== editing?.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Descripción</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Orden</label>
                <Input
                  type="number"
                  value={sort}
                  onChange={(e) => setSort(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex flex-col justify-center gap-1.5 pt-4">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <Switch checked={active} onCheckedChange={setActive} />
                  <span>Rama activa</span>
                </label>
              </div>
            </div>
            <DialogFooter className="pt-4">
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
  )
}
