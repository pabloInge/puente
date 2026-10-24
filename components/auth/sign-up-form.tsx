'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Spinner } from '@/components/ui/spinner'
import { signUp } from '@/lib/auth-client'
import { roleHome, routes } from '@/lib/navigation'
import { MIN_PASSWORD_LENGTH, signUpSchema, type SignupRole } from '@/lib/validation/auth'

import { authErrorMessage } from './auth-error'

type FieldName = 'name' | 'email' | 'password' | 'role' | 'birthDate' | 'acceptTerms'
type Errors = Partial<Record<FieldName, string>>

const roleOptions: { value: SignupRole; title: string; description: string }[] = [
  { value: 'patient', title: 'Paciente', description: 'Busco un profesional y quiero seguir mi tratamiento.' },
  { value: 'professional', title: 'Profesional', description: 'Soy psicólogo o psicóloga matriculado y atiendo pacientes.' },
]

export function SignUpForm() {
  const router = useRouter()
  const [role, setRole] = useState<SignupRole | ''>('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const form = new FormData(event.currentTarget)
    const parsed = signUpSchema.safeParse({
      name: form.get('name'),
      email: form.get('email'),
      password: form.get('password'),
      birthDate: form.get('birthDate'),
      role: role || undefined,
      acceptTerms,
    })
    if (!parsed.success) {
      const next: Errors = {}
      for (const issue of parsed.error.issues) next[issue.path[0] as FieldName] ??= issue.message
      setErrors(next)
      return
    }
    setErrors({})
    setPending(true)
    // acceptTerms no es un campo del usuario: lo valida el hook del servidor y queda en auditoría.
    const { error } = await signUp.email({ ...parsed.data, acceptTerms: true } as Parameters<typeof signUp.email>[0])
    if (error) {
      setPending(false)
      setFormError(authErrorMessage(error, 'No pudimos crear la cuenta. Revisá los datos o probá con otro email.'))
      return
    }
    router.replace(roleHome[parsed.data.role])
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <FieldSet data-invalid={errors.role ? true : undefined}>
        <FieldLegend variant="label">¿Cómo vas a usar Puente?</FieldLegend>
        <RadioGroup value={role} onValueChange={(value) => setRole(value as SignupRole)} aria-invalid={!!errors.role}>
          {roleOptions.map((option) => (
            <FieldLabel key={option.value} htmlFor={`role-${option.value}`}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>{option.title}</FieldTitle>
                  <FieldDescription>{option.description}</FieldDescription>
                </FieldContent>
                <RadioGroupItem value={option.value} id={`role-${option.value}`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        {errors.role ? <FieldError>{errors.role}</FieldError> : null}
      </FieldSet>

      <FieldGroup>
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="name">Nombre y apellido</FieldLabel>
          <Input id="name" name="name" autoComplete="name" required aria-invalid={!!errors.name} />
          {errors.name ? <FieldError>{errors.name}</FieldError> : null}
        </Field>
        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} />
          {errors.email ? <FieldError>{errors.email}</FieldError> : null}
        </Field>
        <Field data-invalid={errors.birthDate ? true : undefined}>
          <FieldLabel htmlFor="birthDate">Fecha de nacimiento</FieldLabel>
          <Input id="birthDate" name="birthDate" type="date" autoComplete="bday" required aria-invalid={!!errors.birthDate} />
          <FieldDescription>Puente es solo para personas de 18 años o más.</FieldDescription>
          {errors.birthDate ? <FieldError>{errors.birthDate}</FieldError> : null}
        </Field>
        <Field data-invalid={errors.password ? true : undefined}>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            aria-invalid={!!errors.password}
          />
          <FieldDescription>Al menos {MIN_PASSWORD_LENGTH} caracteres.</FieldDescription>
          {errors.password ? <FieldError>{errors.password}</FieldError> : null}
        </Field>
        <Field orientation="horizontal" data-invalid={errors.acceptTerms ? true : undefined}>
          <Checkbox
            id="acceptTerms"
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked === true)}
            aria-invalid={!!errors.acceptTerms}
          />
          <FieldContent>
            <FieldLabel htmlFor="acceptTerms" className="font-normal">
              Acepto los términos y condiciones y la política de privacidad.
            </FieldLabel>
            <FieldDescription>Tus datos de salud son datos sensibles (Ley 25.326) y solo los ve tu profesional.</FieldDescription>
            {errors.acceptTerms ? <FieldError>{errors.acceptTerms}</FieldError> : null}
          </FieldContent>
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Crear cuenta
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{' '}
        <Link href={routes.signIn.href} className="font-medium text-primary underline-offset-4 hover:underline">
          Ingresá
        </Link>
      </p>
    </form>
  )
}
