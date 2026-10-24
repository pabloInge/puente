export type Modality = 'in_person' | 'online' | 'both'

export type RecommendationFilters = {
  branchSlugs?: string[]
  modality?: Modality
  province?: string
  coverageId?: string
  maxFee?: number
  language?: string
}

/** Datos públicos de un profesional publicado. Nunca incluye datos de pacientes. */
export type CandidateProfessional = {
  professionalId: string
  branchSlugs: string[]
  approaches: string[]
  modality: Modality
  province: string | null
  coverageIds: string[]
  feeMin: number | null
  nextAvailableAt: Date | null
}

export type RecommendationInput = {
  /** Texto libre con lo que busca el paciente. Puede estar vacío si solo usa filtros. */
  text: string
  filters: RecommendationFilters
  /** Profesionales ya filtrados por el servicio de búsqueda. */
  candidates: CandidateProfessional[]
  patientCoverageId?: string | null
  limit?: number
  now?: Date
}

export type RecommendedProfessional = {
  professionalId: string
  score: number
  /** Motivos legibles que se muestran al paciente. */
  reasons: string[]
}

export type RecommendationResult = {
  topics: string[]
  suggestedBranchSlugs: string[]
  recommendations: RecommendedProfessional[]
  disclaimer: string
}

export interface RecommendationEngine {
  recommend(input: RecommendationInput): Promise<RecommendationResult>
}

export const RECOMMENDATION_DISCLAIMER =
  'Es una orientación para ayudarte a encontrar profesionales. No es un diagnóstico ni reemplaza una consulta.'
