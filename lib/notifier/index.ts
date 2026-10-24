import 'server-only'
import { db } from '@/lib/db'
import { notification } from '@/lib/db/schema'
import type { NotificationEvent, Notifier } from './types'

export * from './types'

/** Implementación actual: notificaciones dentro de la app. Cambiar de canal es cambiar este objeto. */
const dbNotifier: Notifier = {
  async send(userId, event) {
    await db.insert(notification).values({
      userId,
      type: event.type,
      payload: event.payload ?? {},
    })
  },

  async sendMany(userIds, event: NotificationEvent) {
    const unique = [...new Set(userIds)]
    if (unique.length === 0) return
    await db
      .insert(notification)
      .values(unique.map((userId) => ({ userId, type: event.type, payload: event.payload ?? {} })))
  },
}

export const notifier: Notifier = dbNotifier
