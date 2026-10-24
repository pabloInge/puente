import { describe, expect, it } from 'vitest'
import { BRANCH_CATALOG } from './branches'
import { mockRecommendationEngine } from './mock-engine'
import type { CandidateProfessional } from './types'
import { mockSummaryWriter } from '../summaries/mock-writer'
import type { WeeklyAggregate } from '../summaries/types'

const NOW = new Date('2026-10-24T12:00:00Z')

const candidate = (overrides: Partial<CandidateProfessional>): CandidateProfessional => ({
  professionalId: 'p',
  branchSlugs: [],
  approaches: [],
  modality: 'both',
  province: null,
  coverageIds: [],
  feeMin: null,
  nextAvailableAt: null,
  ...overrides,
})

describe('catálogo de ramas', () => {
  it('no repite slugs y todo padre existe', () => {
    const slugs = BRANCH_CATALOG.map((b) => b.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const branch of BRANCH_CATALOG) {
      if (branch.parentSlug) expect(slugs).toContain(branch.parentSlug)
    }
  })
})

describe('motor de recomendación (mock)', () => {
  it('detecta temas ignorando tildes y mayúsculas', async () => {
    const result = await mockRecommendationEngine.recommend({
      text: 'Tengo mucha ANSIEDAD y problemas de sueño',
      filters: {},
      candidates: [],
      now: NOW,
    })
    expect(result.topics).toContain('Ansiedad y estrés')
    expect(result.suggestedBranchSlugs).toContain('ansiedad-estres')
    expect(result.disclaimer).toMatch(/no es un diagnóstico/i)
  })

  it('ordena primero a quien trabaja el tema y explica el motivo', async () => {
    const result = await mockRecommendationEngine.recommend({
      text: 'estoy pasando un duelo',
      filters: {},
      candidates: [
        candidate({ professionalId: 'otro', branchSlugs: ['laboral'] }),
        candidate({ professionalId: 'duelo', branchSlugs: ['duelo'] }),
      ],
      now: NOW,
    })
    expect(result.recommendations[0].professionalId).toBe('duelo')
    expect(result.recommendations[0].reasons.length).toBeGreaterThan(0)
  })

  it('suma por cobertura y disponibilidad cercana', async () => {
    const result = await mockRecommendationEngine.recommend({
      text: '',
      filters: { coverageId: 'osde' },
      candidates: [
        candidate({ professionalId: 'sin' }),
        candidate({
          professionalId: 'con',
          coverageIds: ['osde'],
          nextAvailableAt: new Date(NOW.getTime() + 2 * 24 * 60 * 60 * 1000),
        }),
      ],
      now: NOW,
    })
    expect(result.recommendations[0].professionalId).toBe('con')
  })

  it('respeta el límite pedido', async () => {
    const candidates = Array.from({ length: 10 }, (_, i) => candidate({ professionalId: `p${i}` }))
    const result = await mockRecommendationEngine.recommend({
      text: '',
      filters: {},
      candidates,
      limit: 3,
      now: NOW,
    })
    expect(result.recommendations).toHaveLength(3)
  })
})

describe('generador de resúmenes (mock)', () => {
  const week: WeeklyAggregate = {
    weekStart: '2026-10-19',
    journal: { total: 4, conflict: 2, need: 1, other: 1, averageMood: 3.4 },
    indications: { assigned: 2, seen: 2, commented: 1 },
    appointments: { completed: 1, noShow: 0, cancelled: 0, upcoming: 1 },
    messages: { fromPatient: 3, fromProfessional: 2 },
  }

  it('describe la semana solo con cantidades', async () => {
    const text = await mockSummaryWriter.writeWeekly(week)
    expect(text).toContain('2026-10-19')
    expect(text).toContain('4 entradas')
    expect(text).toContain('2 conflictos')
  })

  it('avisa cuando no hubo entradas', async () => {
    const text = await mockSummaryWriter.writeWeekly({
      ...week,
      journal: { total: 0, conflict: 0, need: 0, other: 0, averageMood: null },
    })
    expect(text).toContain('No hubo entradas')
  })

  it('el resumen histórico detecta la tendencia del ánimo', async () => {
    const text = await mockSummaryWriter.writeHistoric({
      weeks: [
        { ...week, journal: { ...week.journal, averageMood: 2 } },
        { ...week, journal: { ...week.journal, averageMood: 4 } },
      ],
      startingPoint: null,
      progress: [],
    })
    expect(text).toContain('subió')
  })
})
