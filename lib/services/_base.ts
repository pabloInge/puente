import 'server-only'
import { z } from 'zod'
import { db, type Db } from '@/lib/db'
import type { Role } from '@/lib/navigation'
import type { Session } from '@/lib/session'
import {
  ForbiddenError,
  InvalidInputError,
  isServiceError,
  UnauthenticatedError,
  type ServiceErrorCode,
} from './errors'

export type ServiceContext = { session: Session; db: Db }

export function createContext(session: Session | null | undefined): ServiceContext {
  if (!session) throw new UnauthenticatedError()
  return { session, db }
}

export function requireRoleIn(session: Session, ...roles: Role[]): void {
  if (!roles.includes(session.user.role)) {
    throw new ForbiddenError('Tu cuenta no tiene acceso a esta acción.')
  }
}

export function parseInput<S extends z.ZodType>(schema: S, raw: unknown): z.output<S> {
  const parsed = schema.safeParse(raw)
  if (parsed.success) return parsed.data

  const fieldErrors: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.') || '_'
    fieldErrors[key] ??= issue.message
  }
  throw new InvalidInputError(fieldErrors)
}

type ServiceDefinition<S extends z.ZodType, R> = {
  /** Roles autorizados. La autorización por vínculo se resuelve dentro de `run`. */
  roles: Role[]
  input: S
  run: (ctx: ServiceContext, input: z.output<S>) => Promise<R>
}

/**
 * Plantilla de servicio: sesión, rol, validación de entrada y contexto.
 * Cada pista define sus servicios con esto, así ninguna olvida un paso.
 */
export function defineService<S extends z.ZodType, R>(definition: ServiceDefinition<S, R>) {
  return async (session: Session | null | undefined, rawInput: z.input<S>): Promise<R> => {
    const ctx = createContext(session)
    requireRoleIn(ctx.session, ...definition.roles)
    const input = parseInput(definition.input, rawInput)
    return definition.run(ctx, input)
  }
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      error: {
        code: ServiceErrorCode
        message: string
        rule?: string
        fieldErrors?: Record<string, string>
      }
    }

/**
 * Para Server Actions: devuelve los errores de negocio como datos para que la UI
 * los muestre. Los errores inesperados (incluidos redirect/notFound de Next) se relanzan.
 */
export async function toActionResult<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (error) {
    if (!isServiceError(error)) throw error
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        rule: error.rule,
        fieldErrors: error.fieldErrors,
      },
    }
  }
}
