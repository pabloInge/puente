import type { Db } from '..'
import { DEFAULT_RULES } from '../../policies/defaults'
import {
  benefit,
  branch,
  clinicalTemplate,
  consentVersion,
  coverage,
  platformSetting,
} from '../schema/catalog'
import { DEFAULT_PROGRESS_STAGES } from '../schema/summaries'
import { ids, insertAll, seedId } from './ids'

// Doc 04 §3.1 (P-07). Sub-branches are clinical populations/issues; minors are excluded.
export const BRANCHES: { slug: string; name: string; parent: string | null }[] = [
  { slug: 'clinica', name: 'Psicología clínica', parent: null },
  { slug: 'clinica-adultos', name: 'Adultos', parent: 'clinica' },
  { slug: 'clinica-parejas', name: 'Parejas', parent: 'clinica' },
  { slug: 'clinica-familias', name: 'Familias', parent: 'clinica' },
  { slug: 'clinica-adultos-mayores', name: 'Adultos mayores (gerontología)', parent: 'clinica' },
  { slug: 'clinica-adicciones', name: 'Adicciones', parent: 'clinica' },
  { slug: 'clinica-tca', name: 'Trastornos de la conducta alimentaria', parent: 'clinica' },
  { slug: 'clinica-duelo', name: 'Duelo y pérdidas', parent: 'clinica' },
  { slug: 'clinica-ansiedad', name: 'Ansiedad y estrés', parent: 'clinica' },
  { slug: 'clinica-trauma', name: 'Trauma', parent: 'clinica' },
  { slug: 'clinica-diversidad', name: 'Diversidad sexual y de género', parent: 'clinica' },
  { slug: 'salud', name: 'Psicología de la salud / sanitaria', parent: null },
  { slug: 'neuropsicologia', name: 'Neuropsicología', parent: null },
  { slug: 'laboral', name: 'Psicología laboral y organizacional', parent: null },
  { slug: 'educacional', name: 'Psicología educacional', parent: null },
  { slug: 'juridica', name: 'Psicología jurídica y forense', parent: null },
  { slug: 'comunitaria', name: 'Psicología social y comunitaria', parent: null },
  { slug: 'deporte', name: 'Psicología del deporte', parent: null },
  { slug: 'emergencia', name: 'Psicología de la emergencia y catástrofes', parent: null },
]

export const THEORETICAL_APPROACHES = [
  'psicoanálisis',
  'cognitivo-conductual',
  'sistémico',
  'gestáltico',
  'humanista-existencial',
  'integrativo',
  'terapias de tercera generación (ACT, DBT)',
] as const

// Doc 04 §3.2: fictitious data that Admin replaces with the real catalog.
export const COVERAGES = [
  {
    n: 0,
    name: 'Programa Nacional de Salud Mental (ejemplo)',
    type: 'public_program',
    jurisdiction: 'nacional',
    benefit: { description: 'Bonificación total de la consulta', discountType: 'full', value: null },
  },
  {
    n: 1,
    name: 'Programa Provincial de Bienestar (ejemplo)',
    type: 'public_program',
    jurisdiction: 'Córdoba',
    benefit: { description: 'Bonificación del 50 % de la consulta', discountType: 'percent', value: '50' },
  },
  {
    n: 2,
    name: 'Obra Social Horizonte (ejemplo)',
    type: 'obra_social',
    jurisdiction: 'nacional',
    benefit: { description: 'Bonificación del 30 % de la consulta', discountType: 'percent', value: '30' },
  },
  {
    n: 3,
    name: 'Obra Social del Sur (ejemplo)',
    type: 'obra_social',
    jurisdiction: 'nacional',
    benefit: { description: 'Bonificación del 40 % de la consulta', discountType: 'percent', value: '40' },
  },
  {
    n: 4,
    name: 'Prepaga Alameda (ejemplo)',
    type: 'prepaga',
    jurisdiction: 'nacional',
    benefit: { description: 'Reintegro del 20 % de la consulta', discountType: 'percent', value: '20' },
  },
] as const

const CONSENTS = [
  {
    kind: 'informed_consent',
    bodyMd: `# Consentimiento informado (versión 1, texto de ejemplo)

Al aceptar este consentimiento autorizás a la persona profesional a **iniciar un vínculo terapéutico** a través de Puente.

- Se registrará una historia clínica que solo vos y tu profesional pueden ver.
- Podés pedir una copia de tu historia clínica y finalizar el vínculo cuando quieras.
- Si tu profesional detecta un riesgo para vos o para terceras personas, podrá actuar según la ley vigente.

Este texto es de ejemplo y debe ser reemplazado por el definitivo.`,
  },
  {
    kind: 'terms',
    bodyMd: `# Términos y condiciones (versión 1, texto de ejemplo)

Puente conecta a personas adultas con profesionales de la psicología. Puente no brinda atención de emergencia: ante una crisis, llamá al 135 (CABA y GBA) o al 0800 999 0091.`,
  },
  {
    kind: 'privacy',
    bodyMd: `# Política de privacidad (versión 1, texto de ejemplo)

Tus datos se almacenan cifrados y solo se usan para prestarte el servicio. Podés solicitar su acceso, rectificación o supresión según la Ley 25.326.`,
  },
] as const

const TEMPLATES = [
  {
    key: 'starting-point',
    name: 'Punto de partida',
    entryKind: 'starting_point',
    sections: [
      { title: 'Motivo de consulta', hint: 'Qué lleva a la persona a iniciar el tratamiento.' },
      { title: 'Antecedentes relevantes', hint: 'Historia personal, familiar y tratamientos previos.' },
      { title: 'Objetivos terapéuticos', hint: 'Metas acordadas para el comienzo.' },
    ],
  },
  {
    key: 'first-impressions',
    name: 'Primeras impresiones',
    entryKind: 'first_impressions',
    sections: [
      { title: 'Presentación y vínculo', hint: 'Cómo se presenta y cómo se establece el encuadre.' },
      { title: 'Hipótesis inicial', hint: 'Lectura clínica provisoria.' },
      { title: 'Plan de abordaje', hint: 'Frecuencia, modalidad y primeras intervenciones.' },
    ],
  },
  {
    key: 'evolution',
    name: 'Evolución de sesión',
    entryKind: 'evolution',
    sections: [
      { title: 'Temas trabajados', hint: 'Contenido principal de la sesión.' },
      { title: 'Intervenciones', hint: 'Qué se hizo y cómo respondió la persona.' },
      { title: 'Próximos pasos', hint: 'Tareas e ideas para la siguiente sesión.' },
    ],
  },
] as const

export async function seedCatalogs(db: Db): Promise<void> {
  await insertAll(
    db,
    branch,
    BRANCHES.map((b, index) => ({
      id: ids.branch(b.slug),
      slug: b.slug,
      name: b.name,
      parentId: b.parent ? ids.branch(b.parent) : null,
      sort: index,
    })),
  )

  await insertAll(
    db,
    coverage,
    COVERAGES.map((c) => ({
      id: ids.coverage(c.n),
      name: c.name,
      type: c.type,
      jurisdiction: c.jurisdiction,
    })),
  )
  await insertAll(
    db,
    benefit,
    COVERAGES.map((c) => ({
      id: seedId(`benefit:${c.n}`),
      coverageId: ids.coverage(c.n),
      description: c.benefit.description,
      discountType: c.benefit.discountType,
      value: c.benefit.value,
    })),
  )

  await insertAll(
    db,
    consentVersion,
    CONSENTS.map((c) => ({
      id: ids.consent(c.kind),
      kind: c.kind,
      version: '1',
      bodyMd: c.bodyMd,
      publishedAt: new Date(),
      isCurrent: true,
    })),
  )

  await insertAll(
    db,
    clinicalTemplate,
    TEMPLATES.map((t) => ({
      id: ids.template(t.key),
      ownerProfessionalId: null,
      name: t.name,
      entryKind: t.entryKind,
      sections: [...t.sections],
    })),
  )

  const settings: [string, unknown][] = [
    ...Object.entries(DEFAULT_RULES),
    ['progressStages', [...DEFAULT_PROGRESS_STAGES]],
    ['weeklySummaryDay', 'monday'],
    ['naturalLanguageSearchEnabled', true],
  ]
  await insertAll(
    db,
    platformSetting,
    settings.map(([key, value]) => ({ key, value })),
  )
}
