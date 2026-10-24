'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { signIn } from '@/lib/auth-client'
import { roleHome, routes, type Role } from '@/lib/navigation'
import { signInSchema } from '@/lib/validation/auth'

import { authErrorMessage } from './auth-error'

type Errors = Partial<Record<'email' | 'password', string>>

export function SignInForm() {
  const router = useRouter()
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const form = new FormData(event.currentTarget)
    const parsed = signInSchema.safeParse({ email: form.get('email'), password: form.get('password') })
    if (!parsed.success) {
      const next: Errors = {}
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof Errors] ??= issue.message
      setErrors(next)
      return
    }
    setErrors({})
    setPending(true)
    const { data, error } = await signIn.email(parsed.data)
    if (error || !data) {
      setPending(false)
      setFormError(authErrorMessage(error, 'El email o la contraseña no son correctos.'))
      return
    }
    const role = (data.user as { role?: Role }).role
    router.replace(role && role in roleHome ? roleHome[role] : routes.signIn.href)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} />
          {errors.email ? <FieldError>{errors.email}</FieldError> : null}
        </Field>
        <Field data-invalid={errors.password ? true : undefined}>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={!!errors.password}
          />
          {errors.password ? <FieldError>{errors.password}</FieldError> : null}
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Ingresar
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿No tenés cuenta?{' '}
        <Link href={routes.signUp.href} className="font-medium text-primary underline-offset-4 hover:underline">
          Creá una
        </Link>
      </p>
    </form>
  )
}
