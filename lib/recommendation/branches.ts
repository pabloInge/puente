/**
 * Catálogo canónico de ramas de la psicología (doc 03 §3.1).
 * Lo usan el motor de recomendación y el seed (F1-06), así los slugs no se desfasan.
 */
export type BranchDefinition = {
  slug: string
  name: string
  parentSlug: string | null
}

export const BRANCH_CATALOG: readonly BranchDefinition[] = [
  { slug: 'clinica', name: 'Psicología clínica', parentSlug: null },
  { slug: 'adultos', name: 'Adultos', parentSlug: 'clinica' },
  { slug: 'parejas', name: 'Parejas', parentSlug: 'clinica' },
  { slug: 'familias', name: 'Familias', parentSlug: 'clinica' },
  { slug: 'adultos-mayores', name: 'Adultos mayores', parentSlug: 'clinica' },
  { slug: 'adicciones', name: 'Adicciones', parentSlug: 'clinica' },
  { slug: 'tca', name: 'Trastornos de la conducta alimentaria', parentSlug: 'clinica' },
  { slug: 'duelo', name: 'Duelo', parentSlug: 'clinica' },
  { slug: 'ansiedad-estres', name: 'Ansiedad y estrés', parentSlug: 'clinica' },
  { slug: 'trauma', name: 'Trauma', parentSlug: 'clinica' },
  { slug: 'diversidad', name: 'Diversidad y género', parentSlug: 'clinica' },
  { slug: 'salud', name: 'Psicología de la salud', parentSlug: null },
  { slug: 'neuropsicologia', name: 'Neuropsicología', parentSlug: null },
  { slug: 'laboral', name: 'Psicología laboral', parentSlug: null },
  { slug: 'educacional', name: 'Psicología educacional', parentSlug: null },
  { slug: 'juridica-forense', name: 'Psicología jurídica y forense', parentSlug: null },
  { slug: 'social-comunitaria', name: 'Psicología social y comunitaria', parentSlug: null },
  { slug: 'deporte', name: 'Psicología del deporte', parentSlug: null },
  { slug: 'emergencias', name: 'Psicología de emergencias', parentSlug: null },
] as const

export type BranchSlug = (typeof BRANCH_CATALOG)[number]['slug']
