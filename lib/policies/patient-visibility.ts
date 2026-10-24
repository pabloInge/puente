export type BondStatus =
  | 'requested'
  | 'awaiting_consent'
  | 'active'
  | 'rejected'
  | 'cancelled'
  | 'ended'

function toDateParts(value: string | Date): { y: number; m: number; d: number } {
  if (typeof value === 'string') {
    const [y, m, d] = value.slice(0, 10).split('-').map(Number)
    return { y, m, d }
  }
  return { y: value.getUTCFullYear(), m: value.getUTCMonth() + 1, d: value.getUTCDate() }
}

/** Edad en años cumplidos. Acepta `YYYY-MM-DD` o `Date`. */
export function calculateAge(birthDate: string | Date, now: Date = new Date()): number {
  const birth = toDateParts(birthDate)
  const today = toDateParts(now)
  let age = today.y - birth.y
  if (today.m < birth.m || (today.m === birth.m && today.d < birth.d)) age -= 1
  return age
}

/** R-02: solo con un vínculo activo el profesional ve el perfil completo del paciente. */
export function canSeeFullPatientProfile(status: BondStatus | null | undefined): boolean {
  return status === 'active'
}

export type PatientPreviewSource = {
  firstName: string
  birthDate: string | Date | null
  province: string | null
  initialTopics: string | null
  requestMessage: string | null
}

export type PatientPreview = {
  firstName: string
  age: number | null
  province: string | null
  initialTopics: string | null
  requestMessage: string | null
}

/**
 * R-01: sin vínculo activo el profesional ve solo nombre de pila, edad calculada
 * (nunca la fecha de nacimiento), provincia, temas iniciales y mensaje de solicitud.
 * Construye el objeto campo por campo para que un dato nuevo no se filtre sin querer.
 */
export function toPatientPreview(
  source: PatientPreviewSource,
  now: Date = new Date(),
): PatientPreview {
  return {
    firstName: source.firstName,
    age: source.birthDate ? calculateAge(source.birthDate, now) : null,
    province: source.province,
    initialTopics: source.initialTopics,
    requestMessage: source.requestMessage,
  }
}
