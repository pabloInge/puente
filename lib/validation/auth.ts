import { z } from 'zod'

/** Roles que se pueden elegir al registrarse. El rol admin solo se asigna desde el seed. */
export const SIGNUP_ROLES = ['patient', 'professional'] as const
export type SignupRole = (typeof SIGNUP_ROLES)[number]

export const MIN_AGE = 18
export const MIN_PASSWORD_LENGTH = 8

/** R-06: la persona tiene 18 años o más en la fecha `today`. */
export function isAdult(birthDate: string, today = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate)
  if (!match) return false
  const [, y, m, d] = match.map(Number)
  const birth = new Date(Date.UTC(y, m - 1, d))
  if (birth.getUTCFullYear() !== y || birth.getUTCMonth() !== m - 1 || birth.getUTCDate() !== d) return false
  const limit = new Date(Date.UTC(today.getUTCFullYear() - MIN_AGE, today.getUTCMonth(), today.getUTCDate()))
  return birth <= limit
}

export const signInSchema = z.object({
  email: z.email('Ingresá un email válido.'),
  password: z.string().min(1, 'Ingresá tu contraseña.'),
})

export const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá tu nombre completo.').max(120),
  email: z.email('Ingresá un email válido.'),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
    .max(128),
  role: z.enum(SIGNUP_ROLES, 'Elegí cómo vas a usar Puente.'),
  birthDate: z
    .string()
    .min(1, 'Ingresá tu fecha de nacimiento.')
    .refine((value) => isAdult(value), `Tenés que tener ${MIN_AGE} años o más para registrarte.`),
  acceptTerms: z.literal(true, 'Tenés que aceptar los términos y la política de privacidad.'),
})

export type SignUpInput = z.infer<typeof signUpSchema>

/** Códigos que el servidor devuelve y la UI traduce. Nunca revelan si un email existe. */
export const AUTH_ERROR = {
  suspended: 'ACCOUNT_SUSPENDED',
  underage: 'UNDERAGE',
  invalidRole: 'INVALID_ROLE',
  termsRequired: 'TERMS_REQUIRED',
} as const
