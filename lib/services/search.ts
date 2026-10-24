import 'server-only'
import { and, eq, gte, ilike, inArray, lte } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  benefit,
  branch,
  coverage,
  professionalBranch,
  professionalCoverage,
  professionalProfile,
} from '@/lib/db/schema'
import { recommendationEngine } from '@/lib/recommendation'
import type { CandidateProfessional } from '@/lib/recommendation/types'

export const searchFiltersSchema = z.object({
  query: z.string().trim().optional(),
  branchSlug: z.string().trim().optional(),
  modality: z.enum(['in_person', 'online', 'both']).optional(),
  province: z.string().trim().optional(),
  coverageId: z.string().uuid().optional(),
  maxFee: z.number().int().positive().optional(),
  language: z.string().trim().optional(),
  availableThisWeek: z.boolean().optional(),
})

export type SearchFilters = z.infer<typeof searchFiltersSchema>

export type ProfessionalSearchResult = {
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
  feeMin: number | null
  feeMax: number | null
  acceptsNewPatients: boolean
  branches: { id: string; name: string; slug: string }[]
  coverages: { id: string; name: string; type: string; discountDescription?: string | null }[]
  reasons: string[]
  score?: number
}

export type SearchOutput = {
  results: ProfessionalSearchResult[]
  topics: string[]
  suggestedBranchSlugs: string[]
  disclaimer?: string
}

export async function searchProfessionals(filters: SearchFilters = {}): Promise<SearchOutput> {
  const parsed = searchFiltersSchema.parse(filters)

  // 1. Fetch all published professionals
  const conditions = [eq(professionalProfile.isPublished, true)]

  if (parsed.modality && parsed.modality !== 'both') {
    conditions.push(
      inArray(professionalProfile.modality, [parsed.modality, 'both']),
    )
  }

  if (parsed.province) {
    conditions.push(ilike(professionalProfile.province, `%${parsed.province}%`))
  }

  if (parsed.maxFee) {
    conditions.push(lte(professionalProfile.feeMin, parsed.maxFee))
  }

  const profiles = await db
    .select()
    .from(professionalProfile)
    .where(and(...conditions))

  if (profiles.length === 0) {
    return { results: [], topics: [], suggestedBranchSlugs: [] }
  }

  const profileIds = profiles.map((p) => p.id)

  // 2. Fetch associated branches and coverages
  const profBranches = await db
    .select({
      professionalId: professionalBranch.professionalId,
      branchId: branch.id,
      name: branch.name,
      slug: branch.slug,
    })
    .from(professionalBranch)
    .innerJoin(branch, eq(professionalBranch.branchId, branch.id))
    .where(inArray(professionalBranch.professionalId, profileIds))

  const profCoverages = await db
    .select({
      professionalId: professionalCoverage.professionalId,
      coverageId: coverage.id,
      name: coverage.name,
      type: coverage.type,
      benefitDescription: benefit.description,
    })
    .from(professionalCoverage)
    .innerJoin(coverage, eq(professionalCoverage.coverageId, coverage.id))
    .leftJoin(benefit, eq(coverage.id, benefit.coverageId))
    .where(inArray(professionalCoverage.professionalId, profileIds))

  // Group relations by professional
  const branchesByProf = new Map<string, { id: string; name: string; slug: string }[]>()
  for (const pb of profBranches) {
    const list = branchesByProf.get(pb.professionalId) ?? []
    list.push({ id: pb.branchId, name: pb.name, slug: pb.slug })
    branchesByProf.set(pb.professionalId, list)
  }

  const coveragesByProf = new Map<
    string,
    { id: string; name: string; type: string; discountDescription?: string | null }[]
  >()
  for (const pc of profCoverages) {
    const list = coveragesByProf.get(pc.professionalId) ?? []
    list.push({
      id: pc.coverageId,
      name: pc.name,
      type: pc.type,
      discountDescription: pc.benefitDescription,
    })
    coveragesByProf.set(pc.professionalId, list)
  }

  // Filter in memory for multi-table criteria if passed
  let filtered = profiles.filter((p) => {
    if (parsed.branchSlug) {
      const bList = branchesByProf.get(p.id) ?? []
      if (!bList.some((b) => b.slug === parsed.branchSlug)) return false
    }
    if (parsed.coverageId) {
      const cList = coveragesByProf.get(p.id) ?? []
      if (!cList.some((c) => c.id === parsed.coverageId)) return false
    }
    if (parsed.language) {
      if (!p.languages.includes(parsed.language)) return false
    }
    return true
  })

  // 3. Natural Language Recommendation (using mockEngine or configured engine)
  let topics: string[] = []
  let suggestedBranchSlugs: string[] = []
  let disclaimer: string | undefined
  const reasonsMap = new Map<string, string[]>()
  const scoreMap = new Map<string, number>()

  if (parsed.query && parsed.query.trim().length > 0) {
    const candidates: CandidateProfessional[] = filtered.map((p) => ({
      professionalId: p.id,
      branchSlugs: (branchesByProf.get(p.id) ?? []).map((b) => b.slug),
      approaches: p.theoreticalApproach,
      modality: p.modality,
      province: p.province,
      coverageIds: (coveragesByProf.get(p.id) ?? []).map((c) => c.id),
      feeMin: p.feeMin,
      nextAvailableAt: null,
    }))

    const recResult = await recommendationEngine.recommend({
      text: parsed.query,
      filters: {
        branchSlugs: parsed.branchSlug ? [parsed.branchSlug] : undefined,
        modality: parsed.modality,
        province: parsed.province,
        coverageId: parsed.coverageId,
        maxFee: parsed.maxFee,
        language: parsed.language,
      },
      candidates,
    })

    topics = recResult.topics
    suggestedBranchSlugs = recResult.suggestedBranchSlugs
    disclaimer = recResult.disclaimer

    for (const rec of recResult.recommendations) {
      reasonsMap.set(rec.professionalId, rec.reasons)
      scoreMap.set(rec.professionalId, rec.score)
    }

    // Sort by recommendation score descending
    filtered = filtered.sort((a, b) => {
      const scoreA = scoreMap.get(a.id) ?? 0
      const scoreB = scoreMap.get(b.id) ?? 0
      return scoreB - scoreA
    })
  }

  const results: ProfessionalSearchResult[] = filtered.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    bio: p.bio,
    photoUrl: p.photoUrl,
    licenseNumber: p.licenseNumber,
    licenseJurisdiction: p.licenseJurisdiction,
    licenseVerified: p.licenseVerified,
    theoreticalApproach: p.theoreticalApproach,
    modality: p.modality,
    province: p.province,
    city: p.city,
    feeMin: p.feeMin,
    feeMax: p.feeMax,
    acceptsNewPatients: p.acceptsNewPatients,
    branches: branchesByProf.get(p.id) ?? [],
    coverages: coveragesByProf.get(p.id) ?? [],
    reasons: reasonsMap.get(p.id) ?? [],
    score: scoreMap.get(p.id),
  }))

  return {
    results,
    topics,
    suggestedBranchSlugs,
    disclaimer,
  }
}
