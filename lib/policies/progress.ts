export type ProgressVisibilityPolicy =
  | 'patient_decides'
  | 'recommend_show'
  | 'recommend_hide'
  | 'blocked'

export type ProgressVisibilityInput = {
  visibilityPolicy: ProgressVisibilityPolicy
  patientWantsToSee: boolean
}

/** R-05: visible solo si el profesional no lo bloqueó y el paciente eligió verlo. */
export function isProgressVisible(input: ProgressVisibilityInput): boolean {
  return input.visibilityPolicy !== 'blocked' && input.patientWantsToSee
}

/** La recomendación del profesional se muestra como mensaje, pero no obliga. */
export function progressRecommendation(
  policy: ProgressVisibilityPolicy,
): 'show' | 'hide' | null {
  if (policy === 'recommend_show') return 'show'
  if (policy === 'recommend_hide') return 'hide'
  return null
}

export type PatientProgressView =
  | { state: 'blocked' }
  | { state: 'visible'; recommendation: 'show' | 'hide' | null }
  | { state: 'hidden'; recommendation: 'show' | 'hide' | null }

export function patientProgressView(input: ProgressVisibilityInput): PatientProgressView {
  if (input.visibilityPolicy === 'blocked') return { state: 'blocked' }
  const recommendation = progressRecommendation(input.visibilityPolicy)
  return isProgressVisible(input)
    ? { state: 'visible', recommendation }
    : { state: 'hidden', recommendation }
}
