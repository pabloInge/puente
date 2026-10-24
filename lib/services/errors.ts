import type { PolicyResult } from '@/lib/policies/result'

export type ServiceErrorCode =
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'rule_violation'
  | 'invalid_input'

export class ServiceError extends Error {
  readonly code: ServiceErrorCode
  readonly rule?: string
  readonly fieldErrors?: Record<string, string>

  constructor(
    code: ServiceErrorCode,
    message: string,
    extra: { rule?: string; fieldErrors?: Record<string, string> } = {},
  ) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    this.rule = extra.rule
    this.fieldErrors = extra.fieldErrors
  }
}

export class UnauthenticatedError extends ServiceError {
  constructor(message = 'Iniciá sesión para continuar.') {
    super('unauthenticated', message)
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message = 'No tenés permiso para hacer esto.', rule?: string) {
    super('forbidden', message, { rule })
  }
}

export class NotFoundError extends ServiceError {
  constructor(message = 'No encontramos lo que buscás.') {
    super('not_found', message)
  }
}

export class RuleViolationError extends ServiceError {
  constructor(rule: string, message: string) {
    super('rule_violation', message, { rule })
  }
}

export class InvalidInputError extends ServiceError {
  constructor(fieldErrors: Record<string, string>, message = 'Revisá los datos ingresados.') {
    super('invalid_input', message, { fieldErrors })
  }
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError
}

/** Convierte un resultado de política en una excepción de servicio. */
export function assertPolicy(result: PolicyResult): void {
  if (!result.ok) throw new RuleViolationError(result.rule, result.message)
}
