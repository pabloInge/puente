import type { Metadata } from 'next'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { branch } from '@/lib/db/schema'
import { searchProfessionals } from '@/lib/services/search'
import { SearchView } from '@/components/domain/search/search-view'

export const metadata: Metadata = {
  title: 'Buscar profesionales — Puente',
  description: 'Encontrá profesionales de la psicología en Argentina por especialidad, modalidad y cobertura.',
}

type PageProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function BuscarPage({ searchParams }: PageProps) {
  const params = await searchParams

  const query = params.q
  const branchSlug = params.rama
  const modality = params.modalidad as 'in_person' | 'online' | 'both' | undefined
  const maxFee = params.max_honorarios ? parseInt(params.max_honorarios, 10) : undefined

  // 1. Fetch available branches for filter dropdown
  const branchList = await db
    .select({ id: branch.id, name: branch.name, slug: branch.slug })
    .from(branch)
    .where(eq(branch.active, true))
    .orderBy(branch.sort)

  // 2. Perform search
  const { results, topics, suggestedBranchSlugs, disclaimer } = await searchProfessionals({
    query,
    branchSlug,
    modality,
    maxFee,
  })

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Buscar profesionales
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explorá perfiles según tu necesidad, ubicación o modalidad de atención preferida.
        </p>
      </div>

      <SearchView
        initialResults={results}
        initialTopics={topics}
        initialSuggestedBranches={suggestedBranchSlugs}
        initialDisclaimer={disclaimer}
        branches={branchList}
      />
    </div>
  )
}
