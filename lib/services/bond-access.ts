import 'server-only'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { bond, patientProfile, professionalProfile } from '@/lib/db/schema'
import { OPEN_BOND_STATUSES } from '@/lib/policies/bond'
import { bondAllowsMode, type BondAccessMode } from '@/lib/policies/bond-access'
import type { Session } from '@/lib/session'
import { ForbiddenError, NotFoundError } from './errors'

export type Bond = typeof bond.$inferSelect
export type BondParty = 'patient' | 'professional'

export type BondAccess = {
  bond: Bond
  party: BondParty
  patientId: string
  professionalId: string
}

export async function getPatientProfileId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: patientProfile.id })
    .from(patientProfile)
    .where(eq(patientProfile.userId, userId))
    .limit(1)
  return row?.id ?? null
}

export async function getProfessionalProfileId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: professionalProfile.id })
    .from(professionalProfile)
    .where(eq(professionalProfile.userId, userId))
    .limit(1)
  return row?.id ?? null
}

/** Vínculo abierto (solicitado, esperando consentimiento o activo) del paciente, si existe (R-12). */
export async function getOpenBondForPatient(session: Session): Promise<Bond | null> {
  if (session.user.role !== 'patient') return null
  const patientId = await getPatientProfileId(session.user.id)
  if (!patientId) return null

  const [row] = await db
    .select()
    .from(bond)
    .where(and(eq(bond.patientId, patientId), inArray(bond.status, [...OPEN_BOND_STATUSES])))
    .limit(1)
  return row ?? null
}

const bondIdSchema = z.uuid()

/**
 * Único punto de autorización por vínculo (R-03, doc 05 §3).
 * Toda lectura o escritura de datos de un vínculo pasa por acá antes de consultar la base.
 *
 * - Quien no es parte del vínculo recibe NotFound: no se revela que existe.
 * - Una parte con el vínculo en un estado que no admite `mode` recibe Forbidden con la regla.
 * - Admin nunca accede por esta vía: los datos clínicos no son administrables (doc 02).
 */
export async function requireBondAccess(
  session: Session,
  bondId: string,
  mode: BondAccessMode,
  options: { party?: BondParty } = {},
): Promise<BondAccess> {
  const role = session.user.role
  if (role !== 'patient' && role !== 'professional') {
    throw new ForbiddenError('Tu cuenta no tiene acceso a los datos de un vínculo.')
  }

  const parsedId = bondIdSchema.safeParse(bondId)
  if (!parsedId.success) throw new NotFoundError('No encontramos este vínculo.')

  const [row] = await db.select().from(bond).where(eq(bond.id, parsedId.data)).limit(1)
  if (!row) throw new NotFoundError('No encontramos este vínculo.')

  const ownProfileId =
    role === 'patient'
      ? await getPatientProfileId(session.user.id)
      : await getProfessionalProfileId(session.user.id)

  const ownerId = role === 'patient' ? row.patientId : row.professionalId
  if (!ownProfileId || ownProfileId !== ownerId) {
    throw new NotFoundError('No encontramos este vínculo.')
  }

  if (options.party && options.party !== role) {
    throw new ForbiddenError('Esta acción no corresponde a tu rol en el vínculo.')
  }

  const allowed = bondAllowsMode(row.status, mode)
  if (!allowed.ok) throw new ForbiddenError(allowed.message, allowed.rule)

  return {
    bond: row,
    party: role,
    patientId: row.patientId,
    professionalId: row.professionalId,
  }
}
