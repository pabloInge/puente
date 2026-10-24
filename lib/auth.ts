import 'server-only'

import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { eq } from 'drizzle-orm'

import { db, pool } from '@/lib/db'
import { auditLog, user as userTable } from '@/lib/db/schema'
import { AUTH_ERROR, MIN_PASSWORD_LENGTH, SIGNUP_ROLES, isAdult } from '@/lib/validation/auth'

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'patient', input: true },
      birthDate: { type: 'string', required: true, input: true },
      status: { type: 'string', required: false, defaultValue: 'active', input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (data, ctx) => {
          // R-06 y elección de rol: se validan en el servidor aunque la UI ya lo haga.
          if (!SIGNUP_ROLES.includes(data.role as (typeof SIGNUP_ROLES)[number])) {
            throw new APIError('BAD_REQUEST', { message: AUTH_ERROR.invalidRole })
          }
          if (typeof data.birthDate !== 'string' || !isAdult(data.birthDate)) {
            throw new APIError('BAD_REQUEST', { message: AUTH_ERROR.underage })
          }
          if (ctx?.body?.acceptTerms !== true) {
            throw new APIError('BAD_REQUEST', { message: AUTH_ERROR.termsRequired })
          }
          return { data: { ...data, status: 'active' } }
        },
        after: async (created) => {
          await db.insert(auditLog).values([
            { actorUserId: created.id, action: 'terms.accepted', entity: 'user', entityId: created.id },
            { actorUserId: created.id, action: 'privacy.accepted', entity: 'user', entityId: created.id },
          ])
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const [row] = await db
            .select({ status: userTable.status })
            .from(userTable)
            .where(eq(userTable.id, session.userId))
            .limit(1)
          if (row?.status === 'suspended') {
            throw new APIError('FORBIDDEN', { message: AUTH_ERROR.suspended })
          }
        },
      },
    },
  },
  trustedOrigins: [
    ...(process.env.NODE_ENV === 'development'
      ? [
          'http://localhost:3000',
          ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
          ...(process.env.V0_DEV_APP_URL ? [process.env.V0_DEV_APP_URL] : []),
          ...(process.env.V0_BUILD_URL ? [process.env.V0_BUILD_URL] : []),
          ...(process.env.V0_SANDBOX_URL ? [process.env.V0_SANDBOX_URL] : []),
        ]
      : []),
    ...(process.env.NODE_ENV === 'production'
      ? [
          ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
          ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
            : []),
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // Required by the cross-site v0 preview iframe. Without these
          // attributes, login succeeds but the next request appears signed out.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})

export type AuthSession = typeof auth.$Infer.Session
