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

type Benefit = {
  id: string
  coverageId: string
  description: string
  discountType: 'percent' | 'fixed' | 'full'
  value: string | null
  validFrom: string | null
  validTo: string | null
}

type Coverage = {
  id: string
  name: string
  type: 'public_program' | 'obra_social' | 'prepaga' | 'other'
  jurisdiction: string
  externalCode: string | null
  active: boolean
  benefits: Benefit[]
}

export function CoveragesView({ coverages }: { coverages: Coverage[] }) {
  const router = useRouter()
  const [openCoverage, setOpenCoverage] = useState(false)
  const [openBenefit, setOpenBenefit] = useState(false)
  const [selectedCoverageId, setSelectedCoverageId] = useState<string>('')

  // Coverage form
  const [editingCoverage, setEditingCoverage] = useState<Coverage | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<'public_program' | 'obra_social' | 'prepaga' | 'other'>('obra_social')
  const [jurisdiction, setJurisdiction] = useState('nacional')
  const [externalCode, setExternalCode] = useState('')
  const [active, setActive] = useState(true)

  // Benefit form
  const [bDesc, setBDesc] = useState('')
  const [bDiscountType, setBDiscountType] = useState<'percent' | 'fixed' | 'full'>('percent')
  const [bValue, setBValue] = useState('')
  const [loading, setLoading] = useState(false)

  function openCreateCoverage() {
    setEditingCoverage(null)
    setName('')
    setType('obra_social')
    setJurisdiction('nacional')
    setExternalCode('')
    setActive(true)
    setOpenCoverage(true)
  }

  function openEditCoverage(c: Coverage) {
    setEditingCoverage(c)
    setName(c.name)
    setType(c.type)
    setJurisdiction(c.jurisdiction)
    setExternalCode(c.externalCode ?? '')
    setActive(c.active)
    setOpenCoverage(true)
  }

  function openAddBenefit(covId: string) {
    setSelectedCoverageId(covId)
    setBDesc('')
    setBDiscountType('percent')
    setBValue('')
    setOpenBenefit(true)
  }

  async function handleSaveCoverage(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingCoverage) {
        await fetch('/api/admin/coverages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            id: editingCoverage.id,
            data: { name, type, jurisdiction, externalCode: externalCode || null, active },
          }),
        })
      } else {
        await fetch('/api/admin/coverages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            data: { name, type, jurisdiction, externalCode: externalCode || null, active },
          }),
        })
      }
      setOpenCoverage(false)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBenefit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/admin/benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            coverageId: selectedCoverageId,
            description: bDesc,
            discountType: bDiscountType,
            value: bValue || null,
          },
        }),
      })
      setOpenBenefit(false)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteBenefit(id: string) {
    if (!confirm('¿Eliminar este beneficio?')) return
    try {
      await fetch('/api/admin/benefits', {
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
          <h2 className="text-xl font-semibold text-foreground">Obras sociales, prepagas y programas</h2>
          <p className="text-sm text-muted-foreground">
            Gestión de coberturas médicas, convenios y bonificaciones (CU-G-02).
          </p>
        </div>
        <Button onClick={openCreateCoverage} className="flex items-center gap-2">
          <Icon icon={icons.Plus} size="sm" />
          Nueva cobertura
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coverages.map((c) => (
          <Card key={c.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">{c.name}</CardTitle>
                <Badge variant="outline" className="text-xs uppercase">
                  {c.type === 'public_program' ? 'Programa estatal' : c.type}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => openEditCoverage(c)}>
                Editar
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Jurisdicción: <strong className="text-foreground">{c.jurisdiction}</strong></span>
                {c.externalCode && <span>Código: <strong className="text-foreground">{c.externalCode}</strong></span>}
                <span>Estado: {c.active ? <span className="text-emerald-600 font-medium">Activa</span> : <span className="text-muted-foreground">Inactiva</span>}</span>
              </div>

              {/* Benefits list */}
              <div className="rounded-lg border border-border bg-surface-1 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground">Bonificaciones asociadas:</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => openAddBenefit(c.id)}>
                    + Agregar
                  </Button>
                </div>
                {c.benefits.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin bonificaciones especiales registradas.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {c.benefits.map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-xs bg-surface-2/60 rounded px-2 py-1">
                        <div>
                          <span className="font-medium text-foreground">{b.description}</span>
                          <span className="text-muted-foreground ml-2">
                            ({b.discountType === 'full' ? '100% cubierto' : b.discountType === 'percent' ? `${b.value}% desc.` : `$${b.value} fijo`})
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteBenefit(b.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coverage Dialog */}
      <Dialog open={openCoverage} onOpenChange={setOpenCoverage}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCoverage ? 'Editar cobertura' : 'Nueva cobertura'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCoverage} className="flex flex-col gap-4 py-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Nombre</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full rounded-md border border-border bg-background p-2 text-sm"
                >
                  <option value="obra_social">Obra Social</option>
                  <option value="prepaga">Prepaga</option>
                  <option value="public_program">Programa público estatal</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Jurisdicción</label>
                <Input value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Código externo / RNOS</label>
              <Input value={externalCode} onChange={(e) => setExternalCode(e.target.value)} />
            </div>
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Switch checked={active} onCheckedChange={setActive} />
                <span>Cobertura activa</span>
              </label>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpenCoverage(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Benefit Dialog */}
      <Dialog open={openBenefit} onOpenChange={setOpenBenefit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva bonificación / convenio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveBenefit} className="flex flex-col gap-4 py-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Descripción</label>
              <Input value={bDesc} onChange={(e) => setBDesc(e.target.value)} placeholder="Ej. Cobertura plan joven" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Tipo de descuento</label>
                <select
                  value={bDiscountType}
                  onChange={(e) => setBDiscountType(e.target.value as any)}
                  className="w-full rounded-md border border-border bg-background p-2 text-sm"
                >
                  <option value="percent">Porcentaje (%)</option>
                  <option value="fixed">Monto fijo ($)</option>
                  <option value="full">Total (100%)</option>
                </select>
              </div>
              {bDiscountType !== 'full' && (
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Valor</label>
                  <Input value={bValue} onChange={(e) => setBValue(e.target.value)} placeholder="Ej. 20" required />
                </div>
              )}
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpenBenefit(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Agregar bonificación'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
