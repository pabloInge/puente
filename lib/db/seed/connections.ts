import type { Db } from '..'
import { intake } from '../schema/clinical'
import { bond, consentAcceptance, conversation, message } from '../schema/connection'
import { DAY, HOUR, ago, ids, insertAll, seedId } from './ids'

export type BondKey = 'p1-pro1' | 'p2-pro3' | 'p3-pro2' | 'p4-pro4' | 'p5-pro5'
type BondStatus = 'requested' | 'awaiting_consent' | 'active' | 'ended'
type Line = { from: 'pat' | 'pro'; body: string; agoMs: number; read?: boolean }

export type SeedBond = {
  key: BondKey
  pat: number
  pro: number
  status: BondStatus
  requestMessage: string
  requestedAt: Date
  acceptedAt?: Date
  activatedAt?: Date
  endedAt?: Date
  endedBy?: 'patient' | 'professional'
  endReason?: string
  consentAcceptedAt?: Date
  intake: { needs: string; reasonToStart: string }
  conversation: {
    status: 'pre_bond' | 'bond' | 'closed'
    closedReason?: 'professional' | 'inactivity' | 'bond_ended'
    patientMessagesBeforeReply: number
  }
  lines: Line[]
}

// Scenario (one bond per patient, R-12):
//  p1-pro1 active, richest data · p2-pro3 active (duelo) · p3-pro2 request waiting for the professional
//  p4-pro4 accepted, waiting for the patient's consent · p5-pro5 ended with approved closing summary
export const BONDS: SeedBond[] = [
  {
    key: 'p1-pro1', pat: 1, pro: 1, status: 'active',
    requestMessage: 'Hola Lucía, estoy con mucha ansiedad por un cambio en mi trabajo y casi no duermo. ¿Podemos empezar?',
    requestedAt: ago(41 * DAY), acceptedAt: ago(40 * DAY), activatedAt: ago(39 * DAY), consentAcceptedAt: ago(39 * DAY),
    intake: {
      needs: 'Aprender a manejar la ansiedad y recuperar un sueño regular.',
      reasonToStart: 'Me cambiaron de área en el trabajo y desde entonces siento presión constante y me despierto de madrugada.',
    },
    conversation: { status: 'bond', patientMessagesBeforeReply: 0 },
    lines: [
      { from: 'pat', body: 'Hola Lucía, estoy con mucha ansiedad por un cambio en mi trabajo y casi no duermo. ¿Podemos empezar?', agoMs: 41 * DAY },
      { from: 'pro', body: 'Hola Sofía, gracias por escribir. Claro que sí: aceptá el consentimiento y coordinamos una primera consulta.', agoMs: 40 * DAY },
      { from: 'pat', body: 'Ya lo acepté. Quedo atenta al turno.', agoMs: 39 * DAY },
      { from: 'pro', body: 'Te dejé una indicación para esta semana: el ejercicio de respiración antes de dormir. Contame cómo te va.', agoMs: 20 * DAY },
      { from: 'pat', body: 'Lo hice cuatro noches y dormí mejor. Una noche me costó mucho.', agoMs: 18 * DAY },
      { from: 'pro', body: 'Excelente avance. Lo charlamos el martes.', agoMs: 18 * DAY - 2 * HOUR },
      { from: 'pat', body: 'Lucía, ¿puedo mover el turno de la semana próxima a la tarde?', agoMs: 6 * HOUR, read: false },
    ],
  },
  {
    key: 'p2-pro3', pat: 2, pro: 3, status: 'active',
    requestMessage: 'Buenas tardes Valentina. Falleció mi papá hace unos meses y siento que no puedo seguir con mi rutina.',
    requestedAt: ago(30 * DAY), acceptedAt: ago(28 * DAY), activatedAt: ago(27 * DAY), consentAcceptedAt: ago(27 * DAY),
    intake: {
      needs: 'Un espacio para transitar el duelo.',
      reasonToStart: 'La muerte de mi padre en marzo; me cuesta trabajar y estar con mi familia.',
    },
    conversation: { status: 'bond', patientMessagesBeforeReply: 0 },
    lines: [
      { from: 'pat', body: 'Buenas tardes Valentina. Falleció mi papá hace unos meses y siento que no puedo seguir con mi rutina.', agoMs: 30 * DAY },
      { from: 'pro', body: 'Tomás, lamento mucho tu pérdida. Estoy para acompañarte; aceptá el consentimiento y nos vemos esta semana.', agoMs: 28 * DAY },
      { from: 'pat', body: 'Gracias. Nos vemos el jueves.', agoMs: 27 * DAY, read: true },
    ],
  },
  {
    key: 'p3-pro2', pat: 3, pro: 2, status: 'requested',
    requestMessage: 'Hola Martín, mi pareja y yo discutimos mucho por los mismos temas. ¿Atendés parejas de forma individual?',
    requestedAt: ago(20 * HOUR),
    intake: {
      needs: 'Mejorar la comunicación con mi pareja.',
      reasonToStart: 'Discutimos seguido por la organización de la casa y el dinero.',
    },
    conversation: { status: 'pre_bond', patientMessagesBeforeReply: 2 },
    lines: [
      { from: 'pat', body: 'Hola Martín, mi pareja y yo discutimos mucho por los mismos temas. ¿Atendés parejas de forma individual?', agoMs: 20 * HOUR, read: false },
      { from: 'pat', body: 'Te cuento que también me gustaría saber si aceptan mi cobertura.', agoMs: 19 * HOUR, read: false },
    ],
  },
  {
    key: 'p4-pro4', pat: 4, pro: 4, status: 'awaiting_consent',
    requestMessage: 'Joaquín, quiero ordenar mi relación con el alcohol. No sé por dónde empezar.',
    requestedAt: ago(3 * DAY), acceptedAt: ago(1 * DAY),
    intake: {
      needs: 'Reducir el consumo y recuperar rutinas.',
      reasonToStart: 'Los fines de semana se me va de las manos y el lunes no rindo en el trabajo.',
    },
    conversation: { status: 'pre_bond', patientMessagesBeforeReply: 0 },
    lines: [
      { from: 'pat', body: 'Joaquín, quiero ordenar mi relación con el alcohol. No sé por dónde empezar.', agoMs: 3 * DAY, read: true },
      { from: 'pro', body: 'Matías, gracias por animarte. Acepté tu solicitud: solo falta que confirmes el consentimiento informado.', agoMs: 1 * DAY, read: false },
    ],
  },
  {
    key: 'p5-pro5', pat: 5, pro: 5, status: 'ended',
    requestMessage: 'Hola Camila, quiero trabajar mi relación con la comida y con mi cuerpo.',
    requestedAt: ago(75 * DAY), acceptedAt: ago(73 * DAY), activatedAt: ago(72 * DAY), consentAcceptedAt: ago(72 * DAY),
    endedAt: ago(35 * DAY), endedBy: 'professional', endReason: 'Alta terapéutica: objetivos cumplidos.',
    intake: {
      needs: 'Una relación más tranquila con la comida.',
      reasonToStart: 'Los atracones y la culpa posterior me estaban afectando todos los días.',
    },
    conversation: { status: 'closed', closedReason: 'bond_ended', patientMessagesBeforeReply: 0 },
    lines: [
      { from: 'pat', body: 'Hola Camila, quiero trabajar mi relación con la comida y con mi cuerpo.', agoMs: 75 * DAY },
      { from: 'pro', body: 'Hola Carolina, me alegra que escribas. Aceptá el consentimiento y agendamos.', agoMs: 73 * DAY },
      { from: 'pro', body: 'Cerramos el proceso con mucho orgullo por tu trabajo. Te dejo un resumen de cierre.', agoMs: 34 * DAY },
      { from: 'pat', body: 'Gracias por todo, Camila.', agoMs: 34 * DAY - HOUR },
    ],
  },
]

export async function seedConnections(db: Db): Promise<void> {
  await insertAll(
    db,
    bond,
    BONDS.map((b) => ({
      id: ids.bond(b.key),
      patientId: ids.pat(b.pat),
      professionalId: ids.pro(b.pro),
      status: b.status,
      requestMessage: b.requestMessage,
      endedBy: b.endedBy ?? null,
      endReason: b.endReason ?? null,
      requestedAt: b.requestedAt,
      acceptedAt: b.acceptedAt ?? null,
      activatedAt: b.activatedAt ?? null,
      endedAt: b.endedAt ?? null,
    })),
  )

  await insertAll(
    db,
    intake,
    BONDS.map((b) => ({
      id: seedId(`intake:${b.key}`),
      bondId: ids.bond(b.key),
      needs: b.intake.needs,
      reasonToStart: b.intake.reasonToStart,
      submittedAt: b.requestedAt,
    })),
  )

  await insertAll(
    db,
    consentAcceptance,
    BONDS.flatMap((b) =>
      b.consentAcceptedAt
        ? [
            {
              id: seedId(`consent-acceptance:${b.key}`),
              bondId: ids.bond(b.key),
              consentVersionId: ids.consent('informed_consent'),
              acceptedAt: b.consentAcceptedAt,
              ip: '190.0.2.10',
              userAgent: 'seed',
            },
          ]
        : [],
    ),
  )

  await insertAll(
    db,
    conversation,
    BONDS.map((b) => ({
      id: ids.conversation(b.key),
      patientId: ids.pat(b.pat),
      professionalId: ids.pro(b.pro),
      bondId: ids.bond(b.key),
      status: b.conversation.status,
      patientMessagesBeforeReply: b.conversation.patientMessagesBeforeReply,
      closedReason: b.conversation.closedReason ?? null,
      lastMessageAt: ago(Math.min(...b.lines.map((l) => l.agoMs))),
    })),
  )

  await insertAll(
    db,
    message,
    BONDS.flatMap((b) =>
      b.lines.map((line, i) => ({
        id: seedId(`message:${b.key}:${i}`),
        conversationId: ids.conversation(b.key),
        senderUserId: line.from === 'pat' ? ids.patUser(b.pat) : ids.proUser(b.pro),
        body: line.body,
        readAt: line.read === false ? null : ago(line.agoMs - HOUR),
        createdAt: ago(line.agoMs),
      })),
    ),
  )
}
