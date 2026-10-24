import { mockRecommendationEngine } from './mock-engine'
import type { RecommendationEngine } from './types'

export * from './branches'
export * from './types'

/** Para pasar a un motor real, cambiá esta línea: los consumidores no se tocan. */
export const recommendationEngine: RecommendationEngine = mockRecommendationEngine
