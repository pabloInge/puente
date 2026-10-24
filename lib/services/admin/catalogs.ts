import 'server-only'
import { asc, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { benefit, branch, coverage } from '@/lib/db/schema'
import type { Session } from '@/lib/session'
import { requireRoleIn } from '../_base'
import { NotFoundError } from '../errors'

// ==========================================
// Branches & Approaches (CU-G-01)
// ==========================================

export const branchInputSchema = z.object({
  slug: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  sort: z.number().int().default(0),
  active: z.boolean().default(true),
})

export type BranchInput = z.infer<typeof branchInputSchema>

export async function listBranchesAdmin(session: Session) {
  requireRoleIn(session, 'admin')
  return db.select().from(branch).orderBy(asc(branch.sort), asc(branch.name))
}

export async function createBranch(session: Session, rawInput: BranchInput) {
  requireRoleIn(session, 'admin')
  const input = branchInputSchema.parse(rawInput)

  const [created] = await db
    .insert(branch)
    .values({
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      parentId: input.parentId ?? null,
      sort: input.sort,
      active: input.active,
    })
    .returning()

  return created
}

export async function updateBranch(session: Session, id: string, rawInput: Partial<BranchInput>) {
  requireRoleIn(session, 'admin')

  const [updated] = await db
    .update(branch)
    .set({
      ...rawInput,
      updatedAt: new Date(),
    })
    .where(eq(branch.id, id))
    .returning()

  if (!updated) throw new NotFoundError('Rama no encontrada')
  return updated
}

// ==========================================
// Coverages & Benefits (CU-G-02)
// ==========================================

export const coverageInputSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['public_program', 'obra_social', 'prepaga', 'other']),
  jurisdiction: z.string().default('nacional'),
  externalCode: z.string().optional().nullable(),
  active: z.boolean().default(true),
})

export type CoverageInput = z.infer<typeof coverageInputSchema>

export async function listCoveragesAdmin(session: Session) {
  requireRoleIn(session, 'admin')
  const coverages = await db.select().from(coverage).orderBy(asc(coverage.name))
  const benefits = await db.select().from(benefit)

  const benefitMap = new Map<string, typeof benefits>()
  for (const b of benefits) {
    const list = benefitMap.get(b.coverageId) ?? []
    list.push(b)
    benefitMap.set(b.coverageId, list)
  }

  return coverages.map((c) => ({
    ...c,
    benefits: benefitMap.get(c.id) ?? [],
  }))
}

export async function createCoverage(session: Session, rawInput: CoverageInput) {
  requireRoleIn(session, 'admin')
  const input = coverageInputSchema.parse(rawInput)

  const [created] = await db
    .insert(coverage)
    .values({
      name: input.name,
      type: input.type,
      jurisdiction: input.jurisdiction,
      externalCode: input.externalCode ?? null,
      active: input.active,
    })
    .returning()

  return created
}

export async function updateCoverage(session: Session, id: string, rawInput: Partial<CoverageInput>) {
  requireRoleIn(session, 'admin')

  const [updated] = await db
    .update(coverage)
    .set({
      ...rawInput,
      updatedAt: new Date(),
    })
    .where(eq(coverage.id, id))
    .returning()

  if (!updated) throw new NotFoundError('Cobertura no encontrada')
  return updated
}

export const benefitInputSchema = z.object({
  coverageId: z.string().uuid(),
  description: z.string().min(2),
  discountType: z.enum(['percent', 'fixed', 'full']),
  value: z.string().optional().nullable(),
  validFrom: z.string().optional().nullable(),
  validTo: z.string().optional().nullable(),
})

export type BenefitInput = z.infer<typeof benefitInputSchema>

export async function createBenefit(session: Session, rawInput: BenefitInput) {
  requireRoleIn(session, 'admin')
  const input = benefitInputSchema.parse(rawInput)

  const [created] = await db
    .insert(benefit)
    .values({
      coverageId: input.coverageId,
      description: input.description,
      discountType: input.discountType,
      value: input.value ?? null,
      validFrom: input.validFrom ?? null,
      validTo: input.validTo ?? null,
    })
    .returning()

  return created
}

export async function deleteBenefit(session: Session, id: string) {
  requireRoleIn(session, 'admin')
  await db.delete(benefit).where(eq(benefit.id, id))
  return { ok: true }
}
