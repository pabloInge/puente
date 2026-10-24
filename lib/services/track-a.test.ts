import { describe, expect, it } from 'vitest'
import {
  pastExperienceSchema,
  updatePatientProfileSchema,
  updateProfessionalProfileSchema,
} from './profiles'
import { searchFiltersSchema } from './search'
import { sendMessageSchema } from './chat'
import { requestBondSchema, submitIntakeSchema } from './bonds'

describe('Track A - Profile Schemas (A-01)', () => {
  it('validates a complete professional profile update', () => {
    const input = {
      displayName: 'Lic. Mariana Gómez',
      bio: 'Especialista en clínica de adultos.',
      licenseNumber: 'MN 45890',
      licenseJurisdiction: 'CABA',
      theoreticalApproach: ['cognitivo-conductual'],
      modality: 'online' as const,
      feeMin: 35000,
      feeMax: 45000,
      branchIds: ['b17724a1-0000-5000-a000-000000000001'],
      coverageIds: [],
    }

    const parsed = updateProfessionalProfileSchema.safeParse(input)
    expect(parsed.success).toBe(true)
  })

  it('rejects short displayName in professional profile', () => {
    const parsed = updateProfessionalProfileSchema.safeParse({ displayName: 'A' })
    expect(parsed.success).toBe(false)
  })

  it('validates patient profile with valid DNI', () => {
    const input = {
      firstName: 'Tomás',
      lastName: 'Acosta',
      dni: '33987654',
      phone: '+54 11 1234 5678',
      province: 'Santa Fe',
      city: 'Rosario',
      initialTopics: 'Ansiedad ante cambios laborales',
    }

    const parsed = updatePatientProfileSchema.safeParse(input)
    expect(parsed.success).toBe(true)
  })

  it('rejects invalid DNI in patient profile', () => {
    const parsed = updatePatientProfileSchema.safeParse({
      firstName: 'Tomás',
      lastName: 'Acosta',
      dni: '123', // Too short
    })
    expect(parsed.success).toBe(false)
  })

  it('validates past experience creation schema (R-13)', () => {
    const input = {
      periodFrom: '2022-01-01',
      periodTo: '2022-12-31',
      reason: 'Ataques de pánico',
      outcome: 'Mejoría significativa con herramientas de relajación',
      externalProfessionalName: 'Lic. Gómez',
    }

    const parsed = pastExperienceSchema.safeParse(input)
    expect(parsed.success).toBe(true)
  })
})

describe('Track A - Search Filters Schema (A-02)', () => {
  it('parses valid search query and filters', () => {
    const parsed = searchFiltersSchema.safeParse({
      query: 'tengo mucha ansiedad y problemas para dormir',
      branchSlug: 'clinica-adultos',
      modality: 'online',
      maxFee: 50000,
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects negative maxFee', () => {
    const parsed = searchFiltersSchema.safeParse({ maxFee: -100 })
    expect(parsed.success).toBe(false)
  })
})

describe('Track A - Chat Message Schema (A-03)', () => {
  it('accepts valid message with uuid', () => {
    const parsed = sendMessageSchema.safeParse({
      conversationId: 'c17724a1-0000-5000-a000-000000000001',
      body: 'Hola Licenciada, quisiera coordinar una primera consulta.',
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects empty message body', () => {
    const parsed = sendMessageSchema.safeParse({
      conversationId: 'c17724a1-0000-5000-a000-000000000001',
      body: '   ',
    })

    expect(parsed.success).toBe(false)
  })
})

describe('Track A - Bond and Intake Schemas (A-04)', () => {
  it('validates bond request schema', () => {
    const parsed = requestBondSchema.safeParse({
      professionalId: 'a17724a1-0000-5000-a000-000000000001',
      requestMessage: 'Hola, me gustaría comenzar terapia individual.',
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects too short request message', () => {
    const parsed = requestBondSchema.safeParse({
      professionalId: 'a17724a1-0000-5000-a000-000000000001',
      requestMessage: 'Hola',
    })

    expect(parsed.success).toBe(false)
  })

  it('validates intake submission schema', () => {
    const parsed = submitIntakeSchema.safeParse({
      bondId: 'b17724a1-0000-5000-a000-000000000001',
      needs: 'Aprender a gestionar la frustración en el trabajo.',
      reasonToStart: 'Crisis de angustia la semana pasada.',
    })

    expect(parsed.success).toBe(true)
  })
})
