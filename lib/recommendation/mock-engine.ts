import { BRANCH_CATALOG } from './branches'
import {
  RECOMMENDATION_DISCLAIMER,
  type CandidateProfessional,
  type RecommendationEngine,
  type RecommendationInput,
  type RecommendationResult,
  type RecommendedProfessional,
} from './types'

type TopicRule = { topic: string; keywords: string[]; branchSlugs: string[] }

/** Diccionario simple de palabras clave. Sin IA: reemplazable por un motor real sin tocar a los consumidores. */
const TOPIC_RULES: TopicRule[] = [
  {
    topic: 'Ansiedad y estrés',
    keywords: ['ansiedad', 'ansioso', 'estres', 'panico', 'nervios', 'agobio', 'burnout'],
    branchSlugs: ['ansiedad-estres', 'clinica'],
  },
  {
    topic: 'Duelo',
    keywords: ['duelo', 'perdida', 'fallecio', 'murio', 'luto', 'extrano'],
    branchSlugs: ['duelo', 'clinica'],
  },
  {
    topic: 'Pareja',
    keywords: ['pareja', 'separacion', 'divorcio', 'matrimonio', 'novio', 'novia'],
    branchSlugs: ['parejas', 'clinica'],
  },
  {
    topic: 'Familia',
    keywords: ['familia', 'hijos', 'padres', 'crianza', 'adolescente', 'convivencia'],
    branchSlugs: ['familias', 'clinica'],
  },
  {
    topic: 'Trauma',
    keywords: ['trauma', 'abuso', 'violencia', 'accidente', 'estres postraumatico', 'agresion'],
    branchSlugs: ['trauma', 'clinica'],
  },
  {
    topic: 'Alimentación',
    keywords: ['comida', 'anorexia', 'bulimia', 'atracon', 'alimentacion', 'peso', 'cuerpo'],
    branchSlugs: ['tca', 'clinica'],
  },
  {
    topic: 'Consumos',
    keywords: ['adiccion', 'alcohol', 'drogas', 'consumo', 'juego', 'apuestas', 'dependencia'],
    branchSlugs: ['adicciones', 'clinica'],
  },
  {
    topic: 'Trabajo',
    keywords: ['trabajo', 'jefe', 'laboral', 'empleo', 'despido', 'carrera', 'vocacional'],
    branchSlugs: ['laboral'],
  },
  {
    topic: 'Memoria y atención',
    keywords: ['memoria', 'atencion', 'concentracion', 'tdah', 'olvido', 'neurologico'],
    branchSlugs: ['neuropsicologia'],
  },
  {
    topic: 'Identidad y género',
    keywords: ['genero', 'identidad', 'orientacion', 'trans', 'lgbt', 'diversidad'],
    branchSlugs: ['diversidad', 'clinica'],
  },
  {
    topic: 'Vejez',
    keywords: ['jubilacion', 'vejez', 'mayor', 'envejecer', 'soledad'],
    branchSlugs: ['adultos-mayores', 'clinica'],
  },
  {
    topic: 'Estado de ánimo',
    keywords: ['tristeza', 'depresion', 'deprimido', 'animo', 'desgano', 'angustia', 'sueno', 'insomnio'],
    branchSlugs: ['adultos', 'clinica'],
  },
]

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const DEFAULT_LIMIT = 6
const KNOWN_SLUGS = new Set(BRANCH_CATALOG.map((b) => b.slug))

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function detectTopics(text: string): { topics: string[]; branchSlugs: string[] } {
  const normalized = normalize(text)
  const topics: string[] = []
  const branchSlugs = new Set<string>()

  for (const rule of TOPIC_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      topics.push(rule.topic)
      rule.branchSlugs.filter((slug) => KNOWN_SLUGS.has(slug)).forEach((s) => branchSlugs.add(s))
    }
  }
  return { topics, branchSlugs: [...branchSlugs] }
}

function scoreCandidate(
  candidate: CandidateProfessional,
  input: RecommendationInput,
  wantedBranches: Set<string>,
  now: Date,
): RecommendedProfessional {
  let score = 0
  const reasons: string[] = []

  const matchingBranches = candidate.branchSlugs.filter((slug) => wantedBranches.has(slug))
  if (matchingBranches.length > 0) {
    score += 3 * matchingBranches.length
    reasons.push('Trabaja los temas que mencionaste')
  }

  const coverageId = input.filters.coverageId ?? input.patientCoverageId
  if (coverageId && candidate.coverageIds.includes(coverageId)) {
    score += 2
    reasons.push('Atiende con tu cobertura')
  }

  if (
    candidate.nextAvailableAt &&
    candidate.nextAvailableAt.getTime() - now.getTime() <= WEEK_MS
  ) {
    score += 1
    reasons.push('Tiene turnos disponibles esta semana')
  }

  if (input.filters.province && candidate.province === input.filters.province) {
    score += 1
    reasons.push('Atiende en tu provincia')
  }

  return { professionalId: candidate.professionalId, score, reasons }
}

export const mockRecommendationEngine: RecommendationEngine = {
  async recommend(input: RecommendationInput): Promise<RecommendationResult> {
    const now = input.now ?? new Date()
    const detected = detectTopics(input.text)

    const suggestedBranchSlugs = [
      ...new Set([...(input.filters.branchSlugs ?? []), ...detected.branchSlugs]),
    ]
    const wantedBranches = new Set(suggestedBranchSlugs)

    const recommendations = input.candidates
      .map((candidate) => scoreCandidate(candidate, input, wantedBranches, now))
      .sort((a, b) => b.score - a.score)
      .slice(0, input.limit ?? DEFAULT_LIMIT)

    return {
      topics: detected.topics,
      suggestedBranchSlugs,
      recommendations,
      disclaimer: RECOMMENDATION_DISCLAIMER,
    }
  },
}
