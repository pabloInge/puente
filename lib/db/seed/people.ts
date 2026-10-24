import { hashPassword } from 'better-auth/crypto'
import type { Db } from '..'
import { encryptField } from '../../crypto'
import { professionalBranch, professionalCoverage } from '../schema/catalog'
import {
  availabilityRule,
  professionalAgendaSettings,
  serviceType,
  serviceTypeCoverage,
} from '../schema/agenda'
import { account, pastExperience, patientProfile, professionalProfile, user } from '../schema/identity'
import { DEMO_PASSWORD, ids, insertAll, seedId } from './ids'

type Modality = 'in_person' | 'online' | 'both'
// weekday follows JavaScript's Date#getDay: 0 = domingo, 1 = lunes ... 6 = sábado.
type Slot = [weekday: number, start: string, end: string, modality: Modality]

export type SeedProfessional = {
  n: number
  first: string
  last: string
  birthDate: string
  license: string
  jurisdiction: string
  province: string
  city: string
  address: string | null
  modality: Modality
  approaches: string[]
  branches: string[]
  fee: [number, number]
  coverages: number[]
  slots: Slot[]
  bio: string
  verified: boolean
  published: boolean
}

export const PROFESSIONALS: SeedProfessional[] = [
  {
    n: 1, first: 'Lucía', last: 'Ferrari', birthDate: '1985-04-12', license: 'MP 21458',
    jurisdiction: 'CABA', province: 'Ciudad Autónoma de Buenos Aires', city: 'Buenos Aires', address: null,
    modality: 'online', approaches: ['cognitivo-conductual'], branches: ['clinica-adultos', 'clinica-ansiedad'],
    fee: [38000, 45000], coverages: [2, 0],
    slots: [[2, '09:00', '13:00', 'online'], [5, '15:00', '19:00', 'online']],
    bio: 'Acompaño a adultos con ansiedad, estrés laboral y problemas de sueño. Trabajo con objetivos claros y herramientas prácticas entre sesiones.',
    verified: true, published: true,
  },
  {
    n: 2, first: 'Martín', last: 'Quiroga', birthDate: '1979-09-02', license: 'MP 8832',
    jurisdiction: 'Córdoba', province: 'Córdoba', city: 'Córdoba', address: 'Av. Colón 1250, Córdoba',
    modality: 'both', approaches: ['sistémico'], branches: ['clinica-parejas', 'clinica-familias'],
    fee: [40000, 52000], coverages: [1, 3],
    slots: [[1, '10:00', '14:00', 'online'], [3, '16:00', '20:00', 'in_person']],
    bio: 'Terapia de pareja y de familia desde un enfoque sistémico. Me interesa la comunicación y los acuerdos cotidianos.',
    verified: true, published: true,
  },
  {
    n: 3, first: 'Valentina', last: 'Ríos', birthDate: '1982-01-27', license: 'MP 11204',
    jurisdiction: 'Santa Fe', province: 'Santa Fe', city: 'Rosario', address: 'Córdoba 1480, Rosario',
    modality: 'both', approaches: ['psicoanálisis'], branches: ['clinica-trauma', 'clinica-duelo'],
    fee: [35000, 42000], coverages: [0, 2],
    slots: [[4, '15:00', '19:00', 'in_person'], [5, '15:00', '19:00', 'in_person']],
    bio: 'Escucha clínica para atravesar duelos, pérdidas y situaciones traumáticas, a un ritmo que respete cada historia.',
    verified: true, published: true,
  },
  {
    n: 4, first: 'Joaquín', last: 'Benítez', birthDate: '1976-11-18', license: 'MP 6120',
    jurisdiction: 'Mendoza', province: 'Mendoza', city: 'Mendoza', address: 'San Martín 870, Mendoza',
    modality: 'both', approaches: ['humanista-existencial'], branches: ['clinica-adicciones'],
    fee: [36000, 44000], coverages: [3, 4],
    slots: [[3, '14:00', '18:00', 'online'], [1, '09:00', '12:00', 'in_person']],
    bio: 'Trabajo con personas que quieren revisar su relación con el consumo, sin juicios y con metas realistas.',
    verified: true, published: true,
  },
  {
    n: 5, first: 'Camila', last: 'Sosa', birthDate: '1990-06-05', license: 'MP 30977',
    jurisdiction: 'Buenos Aires', province: 'Buenos Aires', city: 'La Plata', address: null,
    modality: 'online', approaches: ['terapias de tercera generación (ACT, DBT)'], branches: ['clinica-tca'],
    fee: [41000, 50000], coverages: [4],
    slots: [[3, '10:00', '14:00', 'online'], [5, '09:00', '13:00', 'online']],
    bio: 'Especializada en conductas alimentarias y relación con el cuerpo, con herramientas de ACT y DBT.',
    verified: true, published: true,
  },
  {
    n: 6, first: 'Federico', last: 'Maldonado', birthDate: '1981-03-14', license: 'MP 17766',
    jurisdiction: 'CABA', province: 'Ciudad Autónoma de Buenos Aires', city: 'Buenos Aires', address: 'Av. Corrientes 3320, CABA',
    modality: 'both', approaches: ['cognitivo-conductual'], branches: ['neuropsicologia'],
    fee: [45000, 60000], coverages: [2, 3],
    slots: [[2, '14:00', '19:00', 'in_person']],
    bio: 'Evaluación y rehabilitación neuropsicológica en adultos: atención, memoria y funciones ejecutivas.',
    verified: true, published: true,
  },
  {
    n: 7, first: 'Agustina', last: 'Paz', birthDate: '1988-08-23', license: 'MP 24511',
    jurisdiction: 'Córdoba', province: 'Córdoba', city: 'Córdoba', address: null,
    modality: 'online', approaches: ['gestáltico'], branches: ['clinica-diversidad', 'clinica-adultos'],
    fee: [34000, 40000], coverages: [1],
    slots: [[1, '15:00', '19:00', 'online'], [4, '10:00', '14:00', 'online']],
    bio: 'Espacio seguro y afirmativo para personas LGBTIQ+. Trabajo desde la experiencia presente y el cuerpo.',
    verified: true, published: true,
  },
  {
    n: 8, first: 'Gonzalo', last: 'Herrera', birthDate: '1972-12-09', license: 'MP 3987',
    jurisdiction: 'Tucumán', province: 'Tucumán', city: 'San Miguel de Tucumán', address: 'Laprida 520, San Miguel de Tucumán',
    modality: 'both', approaches: ['integrativo'], branches: ['clinica-adultos-mayores'],
    fee: [30000, 38000], coverages: [0, 1],
    slots: [[2, '09:00', '13:00', 'in_person'], [4, '09:00', '13:00', 'in_person']],
    bio: 'Acompañamiento a personas mayores y a sus familias en los cambios de la vejez, la jubilación y la pérdida de seres queridos.',
    verified: true, published: true,
  },
  {
    n: 9, first: 'Romina', last: 'Castro', birthDate: '1984-05-30', license: 'MP 19330',
    jurisdiction: 'Buenos Aires', province: 'Buenos Aires', city: 'Mar del Plata', address: null,
    modality: 'online', approaches: ['psicoanálisis'], branches: ['salud'],
    fee: [33000, 40000], coverages: [2],
    slots: [[1, '16:00', '20:00', 'online']],
    bio: 'Psicología de la salud: acompaño procesos de enfermedad crónica, internaciones y cambios de hábitos.',
    verified: true, published: true,
  },
  {
    n: 10, first: 'Nicolás', last: 'Vidal', birthDate: '1991-02-19', license: 'MP 31204',
    jurisdiction: 'CABA', province: 'Ciudad Autónoma de Buenos Aires', city: 'Buenos Aires', address: null,
    modality: 'online', approaches: ['cognitivo-conductual'], branches: ['deporte'],
    fee: [39000, 48000], coverages: [],
    slots: [[3, '17:00', '21:00', 'online']],
    bio: 'Psicología del deporte: manejo de la presión competitiva, foco y recuperación tras lesiones.',
    // Pending license check: lets Admin demo the verification queue.
    verified: false, published: false,
  },
]

export type SeedPatient = {
  n: number
  first: string
  last: string
  birthDate: string
  dni: string
  gender: string
  province: string
  city: string
  coverage: number | null
  member: string | null
  emergency: [name: string, phone: string]
  topics: string
}

export const PATIENTS: SeedPatient[] = [
  {
    n: 1, first: 'Sofía', last: 'Molina', birthDate: '1994-08-21', dni: '38456123', gender: 'femenino',
    province: 'Ciudad Autónoma de Buenos Aires', city: 'Buenos Aires', coverage: 2, member: 'OSH-004512',
    emergency: ['Laura Molina', '+54 11 5555-0102'],
    topics: 'Ansiedad frente a cambios laborales y dificultad para dormir.',
  },
  {
    n: 2, first: 'Tomás', last: 'Acosta', birthDate: '1989-02-03', dni: '33987654', gender: 'masculino',
    province: 'Santa Fe', city: 'Rosario', coverage: 0, member: null,
    emergency: ['Marta Acosta', '+54 341 555-0188'],
    topics: 'Duelo por la muerte de su padre.',
  },
  {
    n: 3, first: 'Julieta', last: 'Navarro', birthDate: '1997-11-15', dni: '40123987', gender: 'femenino',
    province: 'Córdoba', city: 'Córdoba', coverage: 1, member: 'PPB-77120',
    emergency: ['Ernesto Navarro', '+54 351 555-0140'],
    topics: 'Dificultades de comunicación en la pareja.',
  },
  {
    n: 4, first: 'Matías', last: 'Giménez', birthDate: '1992-06-30', dni: '36741852', gender: 'masculino',
    province: 'Mendoza', city: 'Mendoza', coverage: null, member: null,
    emergency: ['Ana Giménez', '+54 261 555-0175'],
    topics: 'Consumo problemático de alcohol; quiere ordenar su rutina.',
  },
  {
    n: 5, first: 'Carolina', last: 'Luna', birthDate: '1986-01-09', dni: '32654987', gender: 'femenino',
    province: 'Buenos Aires', city: 'La Plata', coverage: 4, member: 'ALA-330981',
    emergency: ['Diego Luna', '+54 221 555-0166'],
    topics: 'Alimentación y relación con el cuerpo.',
  },
]

const ascii = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '')

export const emailFor = (first: string, last: string) => `${ascii(first)}.${ascii(last)}@puente.demo`

export const DEMO_ACCOUNTS = {
  admin: 'admin@puente.demo',
  professionals: PROFESSIONALS.map((p) => ({ n: p.n, email: emailFor(p.first, p.last) })),
  patients: PATIENTS.map((p) => ({ n: p.n, email: emailFor(p.first, p.last) })),
}

export async function seedPeople(db: Db): Promise<void> {
  const people = [
    { id: ids.adminUser, name: 'Admin Puente', email: DEMO_ACCOUNTS.admin, role: 'admin' as const, birthDate: '1985-01-01' },
    ...PROFESSIONALS.map((p) => ({
      id: ids.proUser(p.n), name: `${p.first} ${p.last}`, email: emailFor(p.first, p.last),
      role: 'professional' as const, birthDate: p.birthDate,
    })),
    ...PATIENTS.map((p) => ({
      id: ids.patUser(p.n), name: `${p.first} ${p.last}`, email: emailFor(p.first, p.last),
      role: 'patient' as const, birthDate: p.birthDate,
    })),
  ]

  await insertAll(db, user, people.map((u) => ({ ...u, emailVerified: true })))

  const hashes = await Promise.all(people.map(() => hashPassword(DEMO_PASSWORD)))
  await insertAll(
    db,
    account,
    people.map((u, i) => ({
      id: seedId(`account:${u.id}`),
      accountId: u.id,
      providerId: 'credential',
      userId: u.id,
      password: hashes[i],
    })),
  )

  await insertAll(
    db,
    professionalProfile,
    PROFESSIONALS.map((p) => ({
      id: ids.pro(p.n),
      userId: ids.proUser(p.n),
      displayName: `Lic. ${p.first} ${p.last}`,
      bio: p.bio,
      licenseNumber: p.license,
      licenseJurisdiction: p.jurisdiction,
      licenseVerified: p.verified,
      theoreticalApproach: p.approaches,
      modality: p.modality,
      province: p.province,
      city: p.city,
      address: p.address,
      languages: ['es'],
      feeMin: p.fee[0],
      feeMax: p.fee[1],
      acceptsNewPatients: true,
      isPublished: p.published,
    })),
  )

  await insertAll(
    db,
    professionalBranch,
    PROFESSIONALS.flatMap((p) =>
      p.branches.map((slug) => ({ professionalId: ids.pro(p.n), branchId: ids.branch(slug) })),
    ),
  )
  await insertAll(
    db,
    professionalCoverage,
    PROFESSIONALS.flatMap((p) =>
      p.coverages.map((n) => ({ professionalId: ids.pro(p.n), coverageId: ids.coverage(n) })),
    ),
  )

  await insertAll(
    db,
    serviceType,
    PROFESSIONALS.flatMap((p) => [
      {
        id: ids.service(p.n, 'first'),
        professionalId: ids.pro(p.n),
        name: 'Primera consulta',
        durationMin: 50,
        modality: p.modality,
        fee: p.fee[0],
        isFirstConsultation: true,
      },
      {
        id: ids.service(p.n, 'session'),
        professionalId: ids.pro(p.n),
        name: 'Sesión individual',
        durationMin: 45,
        modality: p.modality,
        fee: p.fee[1],
      },
    ]),
  )
  await insertAll(
    db,
    serviceTypeCoverage,
    PROFESSIONALS.flatMap((p) =>
      p.coverages.flatMap((c) =>
        (['first', 'session'] as const).map((kind) => ({
          serviceTypeId: ids.service(p.n, kind),
          coverageId: ids.coverage(c),
        })),
      ),
    ),
  )

  await insertAll(
    db,
    availabilityRule,
    PROFESSIONALS.flatMap((p) =>
      p.slots.map(([weekday, start, end, modality], i) => ({
        id: seedId(`availability:${p.n}:${i}`),
        professionalId: ids.pro(p.n),
        weekday,
        startTime: start,
        endTime: end,
        modality,
      })),
    ),
  )

  // Valentina keeps a stricter cancellation window than the platform default.
  await insertAll(
    db,
    professionalAgendaSettings,
    PROFESSIONALS.map((p) => ({
      professionalId: ids.pro(p.n),
      ...(p.n === 3 ? { minCancelNoticeHours: 48 } : {}),
    })),
  )

  await insertAll(
    db,
    patientProfile,
    PATIENTS.map((p) => ({
      id: ids.pat(p.n),
      userId: ids.patUser(p.n),
      firstName: p.first,
      lastName: p.last,
      dni: encryptField(p.dni),
      gender: p.gender,
      phone: `+54 11 5555-01${String(p.n).padStart(2, '0')}`,
      province: p.province,
      city: p.city,
      coverageId: p.coverage === null ? null : ids.coverage(p.coverage),
      coverageMemberNumber: p.member,
      emergencyContactName: p.emergency[0],
      emergencyContactPhone: p.emergency[1],
      initialTopics: p.topics,
    })),
  )

  await insertAll(db, pastExperience, [
    {
      id: seedId('past:1:external'),
      patientId: ids.pat(1),
      periodFrom: '2021-03-01',
      periodTo: '2021-11-30',
      reason: 'Ataques de pánico durante la pandemia.',
      outcome: 'Mejoría parcial; abandonó por cambio de ciudad.',
      externalProfessionalName: 'Lic. Raúl Domínguez',
    },
    {
      id: seedId('past:2:external'),
      patientId: ids.pat(2),
      periodFrom: '2018-05-01',
      periodTo: '2019-02-28',
      reason: 'Estrés por exámenes y trabajo.',
      outcome: 'Alta por cumplimiento de objetivos.',
      externalProfessionalName: 'Lic. Beatriz Ocampo',
    },
    {
      id: seedId('past:5:internal'),
      patientId: ids.pat(5),
      periodFrom: '2026-01-01',
      periodTo: null,
      reason: 'Tratamiento por conductas alimentarias en Puente.',
      outcome: 'Finalizado con resumen de cierre.',
      professionalId: ids.pro(5),
      closingSummaryId: ids.closingSummary('p5-pro5'),
    },
  ])
}
