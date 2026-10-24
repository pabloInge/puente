'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type ProfessionalProfileFormProps = {
  initialData: {
    id: string
    displayName: string
    bio: string | null
    photoUrl: string | null
    licenseNumber: string | null
    licenseJurisdiction: string | null
    licenseVerified: boolean
    theoreticalApproach: string[]
    modality: 'in_person' | 'online' | 'both'
    province: string | null
    city: string | null
    address: string | null
    feeMin: number | null
    feeMax: number | null
    acceptsNewPatients: boolean
    isPublished: boolean
    branches: { branchId: string; name: string }[]
    coverages: { coverageId: string; name: string }[]
  }
  availableBranches: { id: string; name: string }[]
  availableCoverages: { id: string; name: string }[]
}

export function ProfessionalProfileForm({
  initialData,
  availableBranches,
  availableCoverages,
}: ProfessionalProfileFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    displayName: initialData.displayName,
    bio: initialData.bio ?? '',
    licenseNumber: initialData.licenseNumber ?? '',
    licenseJurisdiction: initialData.licenseJurisdiction ?? '',
    theoreticalApproach: initialData.theoreticalApproach.join(', '),
    modality: initialData.modality,
    province: initialData.province ?? '',
    city: initialData.city ?? '',
    address: initialData.address ?? '',
    feeMin: initialData.feeMin?.toString() ?? '',
    feeMax: initialData.feeMax?.toString() ?? '',
    acceptsNewPatients: initialData.acceptsNewPatients,
    branchIds: initialData.branches.map((b) => b.branchId),
    coverageIds: initialData.coverages.map((c) => c.coverageId),
  })

  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function toggleBranch(id: string) {
    setFormData((prev) => ({
      ...prev,
      branchIds: prev.branchIds.includes(id)
        ? prev.branchIds.filter((bId) => bId !== id)
        : [...prev.branchIds, id],
    }))
  }

  function toggleCoverage(id: string) {
    setFormData((prev) => ({
      ...prev,
      coverageIds: prev.coverageIds.includes(id)
        ? prev.coverageIds.filter((cId) => cId !== id)
        : [...prev.coverageIds, id],
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const payload = {
        displayName: formData.displayName,
        bio: formData.bio,
        licenseNumber: formData.licenseNumber,
        licenseJurisdiction: formData.licenseJurisdiction,
        theoreticalApproach: formData.theoreticalApproach
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        modality: formData.modality,
        province: formData.province,
        city: formData.city,
        address: formData.address,
        feeMin: formData.feeMin ? parseInt(formData.feeMin, 10) : null,
        feeMax: formData.feeMax ? parseInt(formData.feeMax, 10) : null,
        acceptsNewPatients: formData.acceptsNewPatients,
        branchIds: formData.branchIds,
        coverageIds: formData.coverageIds,
      }

      const res = await fetch('/api/pro/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al guardar el perfil.')
      setMessage({ type: 'success', text: 'Perfil actualizado con éxito.' })
      router.refresh()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/pro/profile/publish', {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'No se pudo publicar el perfil.')
      setMessage({
        type: 'success',
        text: '¡Tu perfil ha sido publicado! Ya es visible en las búsquedas públicas.',
      })
      router.refresh()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Status */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-1 p-6 sm:flex-row sm:items-center sm:justify-between shadow-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{initialData.displayName}</h2>
            <Badge variant={initialData.isPublished ? 'default' : 'secondary'}>
              {initialData.isPublished ? 'Publicado' : 'Borrador'}
            </Badge>
            <Badge variant={initialData.licenseVerified ? 'default' : 'outline'}>
              {initialData.licenseVerified ? 'Matrícula verificada' : 'Matrícula no verificada'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {initialData.isPublished
              ? 'Tu perfil es público y los pacientes pueden contactarte.'
              : 'Completá los campos obligatorios para publicar tu perfil.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {initialData.isPublished && (
            <Link
              href={`/profesionales/${initialData.id}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <Icon icon={icons.ExternalLink} size="sm" data-icon="inline-start" />
              Ver vista pública
            </Link>
          )}
          {!initialData.isPublished && (
            <Button size="sm" onClick={handlePublish} disabled={publishing}>
              <Icon icon={icons.Check} size="sm" data-icon="inline-start" />
              {publishing ? 'Publicando...' : 'Publicar perfil'}
            </Button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Identidad y Matrícula */}
        <Card>
          <CardHeader>
            <CardTitle>Identidad profesional</CardTitle>
            <CardDescription>
              Nombre público y datos de tu habilitación profesional.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pro-display-name" className="mb-1 block text-xs font-medium text-foreground">Nombre público / Título</label>
              <Input
                id="pro-display-name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Ej: Lic. Martín Quiroga"
                required
              />
            </div>
            <div>
              <label htmlFor="pro-license-number" className="mb-1 block text-xs font-medium text-foreground">Número de matrícula</label>
              <Input
                id="pro-license-number"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="Ej: MP 8832 / MN 45120"
                required
              />
            </div>
            <div>
              <label htmlFor="pro-license-jurisdiction" className="mb-1 block text-xs font-medium text-foreground">Jurisdicción de matrícula</label>
              <Input
                id="pro-license-jurisdiction"
                value={formData.licenseJurisdiction}
                onChange={(e) => setFormData({ ...formData, licenseJurisdiction: e.target.value })}
                placeholder="Ej: CABA / Córdoba / Santa Fe"
                required
              />
            </div>
            <div>
              <label htmlFor="pro-theoretical-approach" className="mb-1 block text-xs font-medium text-foreground">Enfoques teóricos (separados por coma)</label>
              <Input
                id="pro-theoretical-approach"
                value={formData.theoreticalApproach}
                onChange={(e) => setFormData({ ...formData, theoreticalApproach: e.target.value })}
                placeholder="cognitivo-conductual, sistémico, psicoanálisis"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pro-bio" className="mb-1 block text-xs font-medium text-foreground">Biografía y presentación profesional</label>
              <Textarea
                id="pro-bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                placeholder="Describí tu práctica, experiencia, metodología y valores..."
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Modalidad y Ubicación */}
        <Card>
          <CardHeader>
            <CardTitle>Modalidad y honorarios</CardTitle>
            <CardDescription>
              Configurá cómo atendés y tus valores de referencia.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="pro-modality" className="mb-1 block text-xs font-medium text-foreground">Modalidad</label>
              <select
                id="pro-modality"
                aria-label="Modalidad"
                value={formData.modality}
                onChange={(e) => setFormData({ ...formData, modality: e.target.value as any })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="both">Presencial y Online</option>
                <option value="online">Solo Online</option>
                <option value="in_person">Solo Presencial</option>
              </select>
            </div>
            <div>
              <label htmlFor="pro-fee-min" className="mb-1 block text-xs font-medium text-foreground">Honorario mínimo ($ ARS)</label>
              <Input
                id="pro-fee-min"
                type="number"
                value={formData.feeMin}
                onChange={(e) => setFormData({ ...formData, feeMin: e.target.value })}
                placeholder="35000"
                required
              />
            </div>
            <div>
              <label htmlFor="pro-fee-max" className="mb-1 block text-xs font-medium text-foreground">Honorario máximo ($ ARS)</label>
              <Input
                id="pro-fee-max"
                type="number"
                value={formData.feeMax}
                onChange={(e) => setFormData({ ...formData, feeMax: e.target.value })}
                placeholder="50000"
              />
            </div>
            <div>
              <label htmlFor="pro-province" className="mb-1 block text-xs font-medium text-foreground">Provincia</label>
              <Input
                id="pro-province"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="pro-city" className="mb-1 block text-xs font-medium text-foreground">Ciudad / Localidad</label>
              <Input
                id="pro-city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="pro-address" className="mb-1 block text-xs font-medium text-foreground">Dirección de consultorio (opcional)</label>
              <Input
                id="pro-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ramas de atención */}
        <Card>
          <CardHeader>
            <CardTitle>Ramas y especialidades</CardTitle>
            <CardDescription>
              Seleccioná las áreas en las que ofrecés atención.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {availableBranches.map((b) => {
                const selected = formData.branchIds.includes(b.id)
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleBranch(b.id)}
                    className={`flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors ${
                      selected
                        ? 'border-primary bg-primary/5 font-medium text-primary'
                        : 'border-border bg-surface-1 text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span>{b.name}</span>
                    {selected && <Icon icon={icons.Check} size="sm" />}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Obras sociales y convenios */}
        <Card>
          <CardHeader>
            <CardTitle>Coberturas y programas aceptados</CardTitle>
            <CardDescription>
              Marcá las obras sociales o programas por los que brindás atención.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {availableCoverages.map((c) => {
                const selected = formData.coverageIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCoverage(c.id)}
                    className={`flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors ${
                      selected
                        ? 'border-primary bg-primary/5 font-medium text-primary'
                        : 'border-border bg-surface-1 text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span>{c.name}</span>
                    {selected && <Icon icon={icons.Check} size="sm" />}
                  </button>
                )
              })}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-border pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar perfil'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
