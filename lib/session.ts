import 'server-only'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { auth } from '@/lib/auth'
import { roleHome, routes, type Role } from '@/lib/navigation'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
  status: 'active' | 'suspended'
}

export type Session = { user: SessionUser; sessionId: string }

const ROLES: Role[] = ['patient', 'professional', 'admin']

/** Sesión validada en el servidor. Devuelve null si no hay sesión o el usuario está suspendido. */
export const getSession = cache(async (): Promise<Session | null> => {
  const result = await auth.api.getSession({ headers: await headers() })
  if (!result?.user) return null

  const { id, name, email, role, status } = result.user as typeof result.user & {
    role?: string
    status?: string
  }
  if (status === 'suspended') return null
  if (!ROLES.includes(role as Role)) return null

  return {
    sessionId: result.session.id,
    user: { id, name, email, role: role as Role, status: 'active' },
  }
})

/** Exige sesión. Sin sesión, redirige a /ingresar. */
export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) redirect(routes.signIn.href)
  return session
}

/** Exige un rol. Con otro rol, redirige al panel propio en lugar de mostrar el ajeno. */
export async function requireRole(role: Role): Promise<Session> {
  const session = await requireSession()
  if (session.user.role !== role) redirect(roleHome[session.user.role])
  return session
}

/** Para /ingresar y /registro: si ya hay sesión, va directo al panel del rol. */
export async function redirectIfSignedIn() {
  const session = await getSession()
  if (session) redirect(roleHome[session.user.role])
}
