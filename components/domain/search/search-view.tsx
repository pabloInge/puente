'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import type { ProfessionalSearchResult } from '@/lib/services/search'

type SearchViewProps = {
  initialResults: ProfessionalSearchResult[]
  initialTopics: string[]
  initialSuggestedBranches: string[]
  initialDisclaimer?: string
  branches: { id: string; name: string; slug: string }[]
}

export function SearchView({
  initialResults,
  initialTopics,
  initialSuggestedBranches,
  initialDisclaimer,
  branches,
}: SearchViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [selectedBranch, setSelectedBranch] = useState(searchParams.get('rama') ?? '')
  const [modality, setModality] = useState(searchParams.get('modalidad') ?? '')
  const [maxFee, setMaxFee] = useState(searchParams.get('max_honorarios') ?? '')

  function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (selectedBranch) params.set('rama', selectedBranch)
    if (modality) params.set('modalidad', modality)
    if (maxFee) params.set('max_honorarios', maxFee)
    router.push(`/buscar?${params.toString()}`)
  }

  function clearFilters() {
    setQuery('')
    setSelectedBranch('')
    setModality('')
    setMaxFee('')
    router.push('/buscar')
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Search Header and Form */}
      <div className="rounded-xl border border-border bg-surface-1 p-6 shadow-2">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="q" className="text-sm font-medium text-foreground">
              ¿Qué te gustaría trabajar o qué estás sintiendo?
            </label>
            <div className="relative flex items-center">
              <Input
                id="q"
                placeholder="Ej: Tengo ansiedad por el trabajo, me cuesta dormir o busco orientación..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pr-10"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="absolute right-3 text-muted-foreground hover:text-foreground"
              >
                <Icon icon={icons.Search} size="sm" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Podés escribir en lenguaje natural o utilizar los filtros directos debajo.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="branch-select" className="mb-1 block text-xs font-medium text-muted-foreground">
                Rama de atención
              </label>
              <select
                id="branch-select"
                aria-label="Rama de atención"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Todas las ramas</option>
                {branches.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="modality-select" className="mb-1 block text-xs font-medium text-muted-foreground">
                Modalidad
              </label>
              <select
                id="modality-select"
                aria-label="Modalidad"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Cualquier modalidad</option>
                <option value="online">Online</option>
                <option value="in_person">Presencial</option>
                <option value="both">Presencial y Online</option>
              </select>
            </div>

            <div>
              <label htmlFor="max-fee-input" className="mb-1 block text-xs font-medium text-muted-foreground">
                Honorario máx ($ ARS)
              </label>
              <Input
                id="max-fee-input"
                type="number"
                placeholder="Ej: 50000"
                value={maxFee}
                onChange={(e) => setMaxFee(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
            <Button type="submit" size="sm">
              <Icon icon={icons.Search} size="sm" data-icon="inline-start" />
              Aplicar filtros
            </Button>
          </div>
        </form>
      </div>

      {/* AI Recommendation Insights (if available) */}
      {initialDisclaimer && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <span className="text-primary">
              <Icon icon={icons.Sparkles} />
            </span>
            <div className="flex flex-col gap-1 text-sm">
              <p className="font-medium text-foreground">Orientación sugerida</p>
              <p className="text-muted-foreground">{initialDisclaimer}</p>
              {initialTopics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1">Temas identificados:</span>
                  {initialTopics.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Profesionales disponibles ({initialResults.length})
          </h2>
        </div>

        {initialResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-base font-medium text-foreground">No se encontraron profesionales con estos criterios.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Probá ampliando los filtros o utilizando otros términos de búsqueda.
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
              Restablecer búsqueda
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {initialResults.map((prof) => (
              <Card key={prof.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{prof.displayName}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {prof.licenseJurisdiction} · {prof.licenseNumber ?? 'Sin matrícula registrada'}
                      </p>
                    </div>
                    <Badge variant={prof.licenseVerified ? 'default' : 'outline'} className="text-xs">
                      {prof.licenseVerified ? 'Verificado' : 'Matrícula no verificada'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  {prof.bio && <p className="line-clamp-2 text-muted-foreground">{prof.bio}</p>}

                  {/* Reasons from AI mock */}
                  {prof.reasons.length > 0 && (
                    <div className="rounded-md bg-accent/40 p-2.5 text-xs text-foreground">
                      <p className="font-medium flex items-center gap-1.5 mb-1 text-primary">
                        <Icon icon={icons.Sparkles} size="sm" />
                        Recomendado por:
                      </p>
                      <ul className="list-inside list-disc text-muted-foreground">
                        {prof.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {prof.branches.map((b) => (
                      <Badge key={b.id} variant="secondary" className="text-xs">
                        {b.name}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs">
                      {prof.modality === 'online' ? 'Online' : prof.modality === 'in_person' ? 'Presencial' : 'Online / Presencial'}
                    </Badge>
                  </div>

                  {prof.coverages.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {prof.coverages.map((c) => (
                        <span key={c.id} className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Atiende por {c.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {prof.feeMin ? `Desde $${prof.feeMin.toLocaleString('es-AR')}` : 'Honorarios a convenir'}
                    </span>
                    {prof.province && <span>{prof.city ? `${prof.city}, ${prof.province}` : prof.province}</span>}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border pt-4">
                  <Link
                    href={`/profesionales/${prof.id}`}
                    className={buttonVariants({ variant: 'default', size: 'sm', className: 'w-full' })}
                  >
                    Ver perfil completo
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
