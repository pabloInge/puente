import 'server-only'
import { and, desc, eq, ilike, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auditLog, user } from '@/lib/db/schema'
import type { Session } from '@/lib/session'
import { requireRoleIn } from '../_base'
import { NotFoundError } from '../errors'

// ==========================================
// User Management (CU-G-06)
// NO clinical data is queried or returned here.
// ==========================================

export type ListUsersOptions = {
  role?: 'patient' | 'professional' | 'admin'
  status?: 'active' | 'suspended'
  search?: string
  limit?: number
  offset?: number
}

export async function listUsersAdmin(session: Session, opts: ListUsersOptions = {}) {
  requireRoleIn(session, 'admin')

  const conditions = []
  if (opts.role) conditions.push(eq(user.role, opts.role))
  if (opts.status) conditions.push(eq(user.status, opts.status))
  if (opts.search) {
    conditions.push(
      or(
        ilike(user.name, `%${opts.search}%`),
        ilike(user.email, `%${opts.search}%`),
      ),
    )
  }

  const query = db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)

  if (conditions.length > 0) {
    query.where(and(...conditions))
  }

  const users = await query
    .orderBy(desc(user.createdAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0)

  return users
}

export async function setUserStatusAdmin(
  session: Session,
  userId: string,
  status: 'active' | 'suspended',
) {
  requireRoleIn(session, 'admin')

  const [updated] = await db
    .update(user)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
    })

  if (!updated) throw new NotFoundError('Usuario no encontrado')

  // Log administrative audit action
  await db.insert(auditLog).values({
    actorUserId: session.user.id,
    action: status === 'suspended' ? 'user_suspend' : 'user_reactivate',
    entity: 'user',
    entityId: userId,
  })

  return updated
}

// ==========================================
// Audit Log Viewer (CU-G-07, R-11)
// ==========================================

export type ListAuditLogsOptions = {
  actorUserId?: string
  entity?: string
  action?: string
  limit?: number
  offset?: number
}

export async function listAuditLogsAdmin(session: Session, opts: ListAuditLogsOptions = {}) {
  requireRoleIn(session, 'admin')

  const conditions = []
  if (opts.actorUserId) conditions.push(eq(auditLog.actorUserId, opts.actorUserId))
  if (opts.entity) conditions.push(eq(auditLog.entity, opts.entity))
  if (opts.action) conditions.push(eq(auditLog.action, opts.action))

  const query = db.select().from(auditLog)
  if (conditions.length > 0) {
    query.where(and(...conditions))
  }

  const logs = await query
    .orderBy(desc(auditLog.createdAt))
    .limit(opts.limit ?? 100)
    .offset(opts.offset ?? 0)

  return logs
}
