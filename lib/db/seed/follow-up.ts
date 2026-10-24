import type { Db } from '..'
import { indication, indicationComment, journalEntry, resource } from '../schema/follow-up'
import { progressSettings, progressUpdate } from '../schema/summaries'
import { APPOINTMENTS } from './agenda'
import { entryId } from './clinical'
import { DAY, HOUR, ago, fromNow, ids, insertAll, isoDate, seedId, weekMonday } from './ids'

const aptStart = (key: string): Date => {
  const apt = APPOINTMENTS.find((a) => a.key === key)
  if (!apt) throw new Error(`Unknown seed appointment ${key}`)
  return apt.start
}

const bondA = ids.bond('p1-pro1')
const bondB = ids.bond('p2-pro3')
const bondE = ids.bond('p5-pro5')

export async function seedFollowUp(db: Db): Promise<void> {
  const lastWeek = isoDate(weekMonday(-1))
  const twoWeeksAgo = isoDate(weekMonday(-2))
  const thisWeek = isoDate(weekMonday(0))

  await insertAll(db, journalEntry, [
    {
      id: seedId('journal:p1:1'), bondId: bondA, patientId: ids.pat(1), kind: 'need', mood: 3,
      body: 'Necesito que me ayuden a cortar con el hábito de revisar el mail a la noche.',
      weekStart: twoWeeksAgo, createdAt: ago(13 * DAY), editableUntil: ago(12 * DAY),
      readByProfessionalAt: ago(12 * DAY),
    },
    {
      id: seedId('journal:p1:2'), bondId: bondA, patientId: ids.pat(1), kind: 'conflict', mood: 2,
      body: 'Discutí con mi jefe por un plazo de entrega y me quedé rumiando toda la noche.',
      weekStart: lastWeek, createdAt: ago(8 * DAY), editableUntil: ago(7 * DAY),
      readByProfessionalAt: ago(7 * DAY),
    },
    {
      id: seedId('journal:p1:3'), bondId: bondA, patientId: ids.pat(1), kind: 'other', mood: 4,
      body: 'Esta semana dormí mejor. La respiración me ayudó más de lo que esperaba.',
      weekStart: lastWeek, createdAt: ago(5 * DAY), editableUntil: ago(4 * DAY),
      readByProfessionalAt: null,
    },
    {
      // Still inside its edit window and unread: lets the demo show both states.
      id: seedId('journal:p1:4'), bondId: bondA, patientId: ids.pat(1), kind: 'need', mood: 3,
      body: 'Quisiera practicar cómo decir que no a pedidos fuera de horario.',
      weekStart: thisWeek, createdAt: ago(3 * HOUR), editableUntil: fromNow(21 * HOUR),
      readByProfessionalAt: null,
    },
    {
      id: seedId('journal:p2:1'), bondId: bondB, patientId: ids.pat(2), kind: 'other', mood: 2,
      body: 'Hoy encontré una foto de mi papá y pude llorar. Me sentí acompañado.',
      weekStart: lastWeek, createdAt: ago(9 * DAY), editableUntil: ago(8 * DAY),
      readByProfessionalAt: ago(8 * DAY),
    },
  ])

  await insertAll(db, indication, [
    {
      id: seedId('indication:p1:breathing'), bondId: bondA, kind: 'exercise',
      title: 'Respiración 4-7-8 antes de dormir',
      description: 'Inhalá 4 segundos, retené 7 y exhalá 8. Repetí cuatro ciclos en la cama, con luz tenue.',
      frequency: 'Cada noche', validUntil: isoDate(new Date(Date.now() + 21 * DAY)),
      status: 'active', patientSeenAt: ago(19 * DAY), createdAt: ago(20 * DAY),
    },
    {
      id: seedId('indication:p1:sleep'), bondId: bondA, kind: 'guideline',
      title: 'Higiene del sueño',
      description: 'Horario fijo para acostarte, sin pantallas la última hora y cena liviana.',
      frequency: 'Diaria', status: 'active', patientSeenAt: null, createdAt: ago(2 * DAY),
    },
    {
      id: seedId('indication:p1:reading'), bondId: bondA, kind: 'reading',
      title: 'Lectura: "Cómo manejar la ansiedad anticipatoria"',
      description: 'Capítulos 1 y 2, para comentar en sesión.',
      status: 'archived', patientSeenAt: ago(30 * DAY), createdAt: ago(32 * DAY),
    },
    {
      id: seedId('indication:p2:letter'), bondId: bondB, kind: 'exercise',
      title: 'Carta a mi papá',
      description: 'Escribí lo que no llegaste a decirle. No es necesario entregarla ni compartirla.',
      frequency: 'Una vez', status: 'active', patientSeenAt: ago(15 * DAY), createdAt: ago(16 * DAY),
    },
  ])

  await insertAll(db, indicationComment, [
    {
      id: seedId('indication-comment:p1:1'),
      indicationId: seedId('indication:p1:breathing'),
      authorUserId: ids.patUser(1),
      body: 'Me ayudó, pero una noche me desperté igual. ¿Está bien?',
      createdAt: ago(17 * DAY),
    },
    {
      id: seedId('indication-comment:p1:2'),
      indicationId: seedId('indication:p1:breathing'),
      authorUserId: ids.proUser(1),
      body: 'Es normal. Lo importante es la constancia. Lo vemos en sesión.',
      createdAt: ago(17 * DAY - 3 * HOUR),
    },
  ])

  await insertAll(db, resource, [
    {
      id: seedId('resource:p1:breathing'),
      indicationId: seedId('indication:p1:breathing'),
      type: 'link',
      url: 'https://www.argentina.gob.ar/salud/mental',
      name: 'Material de apoyo sobre salud mental',
    },
  ])

  await insertAll(db, progressSettings, [
    {
      bondId: bondA, format: 'stages', stages: null, visibilityPolicy: 'recommend_show',
      recommendationMessage: 'Creo que ver tu avance puede motivarte, pero es tu decisión.',
      patientWantsToSee: true,
    },
    {
      bondId: bondB, format: 'percent', stages: null, visibilityPolicy: 'recommend_hide',
      recommendationMessage: 'En el duelo prefiero no medir avances por ahora.',
      patientWantsToSee: false,
    },
    { bondId: bondE, format: 'scale_10', stages: null, visibilityPolicy: 'patient_decides', patientWantsToSee: true },
  ])

  await insertAll(db, progressUpdate, [
    {
      id: seedId('progress:p1:1'), bondId: bondA, format: 'stages', value: '2.00',
      note: 'Inicio: la paciente ya aplica las herramientas.', createdAt: aptStart('p1-pro1:2'),
      clinicalEntryId: entryId('p1-pro1:2', 'evolution'),
    },
    {
      id: seedId('progress:p1:2'), bondId: bondA, format: 'stages', value: '3.00',
      note: 'Desarrollo: mejora sostenida del sueño.', createdAt: aptStart('p1-pro1:5'),
      clinicalEntryId: entryId('p1-pro1:5', 'evolution'),
    },
    {
      id: seedId('progress:p2:1'), bondId: bondB, format: 'percent', value: '20.00',
      note: 'Primeras sesiones.', createdAt: aptStart('p2-pro3:2'),
      clinicalEntryId: entryId('p2-pro3:2', 'evolution'),
    },
    {
      id: seedId('progress:p2:2'), bondId: bondB, format: 'percent', value: '35.00',
      createdAt: aptStart('p2-pro3:3'), clinicalEntryId: entryId('p2-pro3:3', 'evolution'),
    },
    {
      id: seedId('progress:p5:1'), bondId: bondE, format: 'scale_10', value: '3.00',
      createdAt: aptStart('p5-pro5:2'), clinicalEntryId: entryId('p5-pro5:2', 'evolution'),
    },
    {
      id: seedId('progress:p5:2'), bondId: bondE, format: 'scale_10', value: '6.00',
      createdAt: aptStart('p5-pro5:3'), clinicalEntryId: entryId('p5-pro5:3', 'evolution'),
    },
    {
      id: seedId('progress:p5:3'), bondId: bondE, format: 'scale_10', value: '9.00',
      note: 'Objetivos cumplidos.', createdAt: aptStart('p5-pro5:4'),
      clinicalEntryId: entryId('p5-pro5:4', 'evolution'),
    },
  ])
}
