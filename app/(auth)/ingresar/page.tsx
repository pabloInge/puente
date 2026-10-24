import type { Metadata } from 'next'

import { SignInForm } from '@/components/auth/sign-in-form'
import { routes } from '@/lib/navigation'
import { redirectIfSignedIn } from '@/lib/session'

export const metadata: Metadata = { title: routes.signIn.label }

export default async function Page() {
  await redirectIfSignedIn()

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Ingresá a tu cuenta</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">Te llevamos directo a tu panel.</p>
      </header>
      <SignInForm />
    </>
  )
}
