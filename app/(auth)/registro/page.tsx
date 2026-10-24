import type { Metadata } from 'next'

import { SignUpForm } from '@/components/auth/sign-up-form'
import { routes } from '@/lib/navigation'
import { redirectIfSignedIn } from '@/lib/session'

export const metadata: Metadata = { title: routes.signUp.label }

export default async function Page() {
  await redirectIfSignedIn()

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Creá tu cuenta</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Como paciente o como profesional. Podés completar tu perfil después.
        </p>
      </header>
      <SignUpForm />
    </>
  )
}
