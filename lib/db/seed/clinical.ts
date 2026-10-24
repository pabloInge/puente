import type { Db } from '..'
import { hashContent } from '../../crypto'
import { clinicalEntry, type ClinicalSection } from '../schema/clinical'
import { PROFESSIONALS } from './people'
import { APPOINTMENTS } from './agenda'
import type { BondKey } from './connections'
import { ids, insertAll } from './ids'

type Kind = 'starting_point' | 'first_impressions' | 'evolution' | 'amendment'

type Entry = {
  bond: BondKey
  pro: number
  kind: Kind
  /** Appointment key (`<bond>:<n>`) the entry belongs to. */
  apt: string
  sections: ClinicalSection[]
  amends?: { apt: string; kind: Kind }
  /** Amendments are written after the fact. */
  delayMs?: number
}

const TEMPLATE_BY_KIND: Record<Kind, string | null> = {
  starting_point: 'starting-point',
  first_impressions: 'first-impressions',
  evolution: 'evolution',
  amendment: null,
}

const ENTRIES: Entry[] = [
  // Sofía & Lucía: anxiety and sleep.
  {
    bond: 'p1-pro1', pro: 1, kind: 'starting_point', apt: 'p1-pro1:1',
    sections: [
      { title: 'Motivo de consulta', body: 'Ansiedad sostenida desde un cambio de área laboral hace tres meses; despertares de madrugada.' },
      { title: 'Antecedentes relevantes', body: 'Episodios de pánico en 2021 con tratamiento parcial. Sin medicación actual.' },
      { title: 'Objetivos terapéuticos', body: 'Reducir la ansiedad anticipatoria y recuperar un patrón de sueño regular.' },
    ],
  },
  {
    bond: 'p1-pro1', pro: 1, kind: 'first_impressions', apt: 'p1-pro1:1',
    sections: [
      { title: 'Presentación y vínculo', body: 'Colaboradora, buen contacto. Se acordó encuadre semanal online.' },
      { title: 'Hipótesis inicial', body: 'Ansiedad reactiva a estresor laboral con rumiación nocturna.' },
      { title: 'Plan de abordaje', body: 'Psicoeducación, registro de pensamientos y higiene del sueño.' },
    ],
  },
  {
    bond: 'p1-pro1', pro: 1, kind: 'evolution', apt: 'p1-pro1:2',
    sections: [
      { title: 'Temas trabajados', body: 'Registro de pensamientos automáticos asociados a reuniones.' },
      { title: 'Intervenciones', body: 'Reestructuración cognitiva inicial; buena respuesta.' },
      { title: 'Próximos pasos', body: 'Respiración 4-7-8 antes de dormir.' },
    ],
  },
  {
    bond: 'p1-pro1', pro: 1, kind: 'evolution', apt: 'p1-pro1:3',
    sections: [
      { title: 'Temas trabajados', body: 'Evaluación de la semana de práctica; cuatro noches de mejor sueño.' },
      { title: 'Intervenciones', body: 'Refuerzo de la rutina nocturna; se trabajó una noche difícil.' },
      { title: 'Próximos pasos', body: 'Sostener el registro y sumar pausas breves durante la jornada.' },
    ],
  },
  {
    bond: 'p1-pro1', pro: 1, kind: 'amendment', apt: 'p1-pro1:3',
    amends: { apt: 'p1-pro1:3', kind: 'evolution' },
    delayMs: 2 * 60 * 60_000,
    sections: [
      { title: 'Aclaración', body: 'Donde dice "cuatro noches" corresponde "cuatro de siete noches".' },
    ],
  },
  {
    bond: 'p1-pro1', pro: 1, kind: 'evolution', apt: 'p1-pro1:5',
    sections: [
      { title: 'Temas trabajados', body: 'Turno anterior cancelado; se retomó el registro y la ansiedad en el trabajo.' },
      { title: 'Intervenciones', body: 'Exposición gradual a la situación de reuniones; práctica de respiración.' },
      { title: 'Próximos pasos', body: 'Seguir con la indicación y evaluar progreso en dos sesiones.' },
    ],
  },
  // Tomás & Valentina: duelo.
  {
    bond: 'p2-pro3', pro: 3, kind: 'starting_point', apt: 'p2-pro3:1',
    sections: [
      { title: 'Motivo de consulta', body: 'Duelo por la muerte del padre hace cuatro meses; dificultad para sostener el trabajo.' },
      { title: 'Antecedentes relevantes', body: 'Sin tratamientos previos recientes. Buen sostén familiar.' },
      { title: 'Objetivos terapéuticos', body: 'Elaborar la pérdida y recuperar la rutina laboral.' },
    ],
  },
  {
    bond: 'p2-pro3', pro: 3, kind: 'first_impressions', apt: 'p2-pro3:1',
    sections: [
      { title: 'Presentación y vínculo', body: 'Angustiado, con discurso fluido. Se establece un encuadre semanal presencial.' },
      { title: 'Hipótesis inicial', body: 'Duelo no complicado con retraimiento reciente.' },
      { title: 'Plan de abordaje', body: 'Escucha clínica y revisión de ritos de despedida pendientes.' },
    ],
  },
  {
    bond: 'p2-pro3', pro: 3, kind: 'evolution', apt: 'p2-pro3:2',
    sections: [
      { title: 'Temas trabajados', body: 'Recuerdos del último año con el padre; culpa por conversaciones pendientes.' },
      { title: 'Intervenciones', body: 'Se habilitó la palabra sobre lo no dicho.' },
      { title: 'Próximos pasos', body: 'Escribir una carta, sin obligación de entregarla.' },
    ],
  },
  {
    bond: 'p2-pro3', pro: 3, kind: 'evolution', apt: 'p2-pro3:3',
    sections: [
      { title: 'Temas trabajados', body: 'Lectura de la carta; aparece alivio y tristeza.' },
      { title: 'Intervenciones', body: 'Acompañamiento sin interpretación; pautas para el regreso al trabajo.' },
      { title: 'Próximos pasos', body: 'Evaluar la vuelta a la rutina deportiva.' },
    ],
  },
  // Carolina & Camila: complete treatment.
  {
    bond: 'p5-pro5', pro: 5, kind: 'starting_point', apt: 'p5-pro5:1',
    sections: [
      { title: 'Motivo de consulta', body: 'Atracones y culpa posterior varias veces por semana.' },
      { title: 'Antecedentes relevantes', body: 'Dietas restrictivas desde la adolescencia.' },
      { title: 'Objetivos terapéuticos', body: 'Regular la alimentación y reducir la autocrítica corporal.' },
    ],
  },
  {
    bond: 'p5-pro5', pro: 5, kind: 'first_impressions', apt: 'p5-pro5:1',
    sections: [
      { title: 'Presentación y vínculo', body: 'Muy motivada; se acuerda trabajo con registro alimentario.' },
      { title: 'Hipótesis inicial', body: 'Patrón de restricción-atracón mantenido por emociones intensas.' },
      { title: 'Plan de abordaje', body: 'Herramientas de DBT para regulación emocional y ACT para valores.' },
    ],
  },
  {
    bond: 'p5-pro5', pro: 5, kind: 'evolution', apt: 'p5-pro5:2',
    sections: [
      { title: 'Temas trabajados', body: 'Disparadores emocionales de los atracones.' },
      { title: 'Intervenciones', body: 'Entrenamiento en tolerancia al malestar.' },
      { title: 'Próximos pasos', body: 'Practicar la técnica TIPP ante el impulso.' },
    ],
  },
  {
    bond: 'p5-pro5', pro: 5, kind: 'evolution', apt: 'p5-pro5:3',
    sections: [
      { title: 'Temas trabajados', body: 'Reducción de atracones a uno por semana.' },
      { title: 'Intervenciones', body: 'Trabajo sobre valores y autocompasión.' },
      { title: 'Próximos pasos', body: 'Consolidar la rutina de comidas.' },
    ],
  },
  {
    bond: 'p5-pro5', pro: 5, kind: 'evolution', apt: 'p5-pro5:4',
    sections: [
      { title: 'Temas trabajados', body: 'Sin atracones en las últimas tres semanas.' },
      { title: 'Intervenciones', body: 'Plan de prevención de recaídas.' },
      { title: 'Próximos pasos', body: 'Acordar el cierre del proceso.' },
    ],
  },
]

const appointmentStart = (key: string): Date => {
  const apt = APPOINTMENTS.find((a) => a.key === key)
  if (!apt) throw new Error(`Unknown seed appointment ${key}`)
  return apt.start
}

export const entryId = (apt: string, kind: Kind) => ids.clinicalEntry(apt, kind)

export async function seedClinical(db: Db): Promise<void> {
  await insertAll(
    db,
    clinicalEntry,
    ENTRIES.map((e) => {
      const pro = PROFESSIONALS.find((p) => p.n === e.pro)!
      const templateKey = TEMPLATE_BY_KIND[e.kind]
      return {
        id: entryId(e.apt, e.kind),
        bondId: ids.bond(e.bond),
        authorProfessionalId: ids.pro(e.pro),
        kind: e.kind,
        amendsEntryId: e.amends ? entryId(e.amends.apt, e.amends.kind) : null,
        appointmentId: ids.appointment(e.apt),
        templateId: templateKey ? ids.template(templateKey) : null,
        content: e.sections,
        contentHash: hashContent(e.sections),
        authorLicenseSnapshot: `${pro.license} (${pro.jurisdiction})`,
        // Written right after the session ends (45-50 min), so the timeline reads naturally.
        createdAt: new Date(appointmentStart(e.apt).getTime() + 60 * 60_000 + (e.delayMs ?? 0)),
      }
    }),
  )
}
