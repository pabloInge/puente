import 'server-only'
import { headers } from 'next/headers'
import { db, type Db } from '@/lib/db'
import { auditLog } from '@/lib/db/schema'

export type AuditAction =
  | 'read'
  | 'create'
  | 'update'
  | 'amend'
  | 'export'
  | 'share'
  | (string & {})

export type AuditEntry = {
  actorUserId: string
  action: AuditAction
  entity: string
  entityId?: string | null
  bondId?: string | null
  ip?: string | null
}

async function resolveIp(): Promise<string | null> {
  try {
    const h = await headers()
    return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null
  } catch {
    // Fuera de un request (cron, seed): no hay IP que registrar.
    return null
  }
}

/**
 * R-11: registra quién accedió a qué y cuándo. La tabla es de solo inserción.
 * Si el registro falla, el error se propaga: no se entrega un dato clínico sin auditar.
 * Pasá `executor` para auditar dentro de la misma transacción.
 */
export async function logAudit(
  entry: AuditEntry,
  executor: Pick<Db, 'insert'> = db,
): Promise<void> {
  const ip = entry.ip === undefined ? await resolveIp() : entry.ip
  await executor.insert(auditLog).values({
    actorUserId: entry.actorUserId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    bondId: entry.bondId ?? null,
    ip,
  })
}

export const audit = { log: logAudit }
