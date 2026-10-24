import { AUTH_ERROR } from '@/lib/validation/auth'

const messages: Record<string, string> = {
  [AUTH_ERROR.suspended]: 'Tu cuenta está suspendida. Escribinos a soporte si creés que es un error.',
  [AUTH_ERROR.underage]: 'Tenés que tener 18 años o más para registrarte.',
  [AUTH_ERROR.invalidRole]: 'Elegí si te registrás como paciente o como profesional.',
  [AUTH_ERROR.termsRequired]: 'Tenés que aceptar los términos y la política de privacidad.',
}

/** Traduce los errores del servidor sin revelar si un email ya está registrado. */
export function authErrorMessage(error: { message?: string } | null | undefined, fallback: string) {
  if (error?.message && messages[error.message]) return messages[error.message]
  return fallback
}
