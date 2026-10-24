import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'
import { db } from '@/lib/db'
import { professionalProfile } from '@/lib/db/schema'
import { getOpenBondForPatient } from '@/lib/services/bond-access'
import { getSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Mi Profesional — Puente',
}

export default async function PatientProfessionalsPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'patient') {
    redirect('/ingresar')
  }

  const openBond = await getOpenBondForPatient(session)

  let prof = null
  if (openBond) {
    const [p] = await db
      .select()
      .from(professionalProfile)
      .where(eq(professionalProfile.id, openBond.professionalId))
      .limit(1)
    prof = p
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Mi profesional</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Información del profesional a cargo de tu tratamiento actual.
        </p>
      </div>

      {!openBond || !prof ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Icon icon={icons.Users} size="md" />
          </span>
          <h2 className="text-xl font-semibold text-foreground">
            No tenés un profesional asignado actualmente
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Podés buscar profesionales en nuestra red según su especialidad, enfoque y modalidad de atención.
          </p>
          <Link href="/buscar" className={buttonVariants({ className: 'mt-6' })}>
            <Icon icon={icons.Search} size="sm" data-icon="inline-start" />
            Buscar profesionales
          </Link>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl text-foreground">{prof.displayName}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {prof.licenseJurisdiction} · {prof.licenseNumber ?? 'Matrícula en trámite'}
                </p>
              </div>
              <Badge
                variant={
                  openBond.status === 'active'
                    ? 'default'
                    : openBond.status === 'awaiting_consent'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {openBond.status === 'active'
                  ? 'Vínculo activo'
                  : openBond.status === 'awaiting_consent'
                    ? 'Esperando consentimiento'
                    : 'Solicitud enviada'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            {prof.bio && <p className="text-muted-foreground">{prof.bio}</p>}
            {prof.theoreticalApproach.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {prof.theoreticalApproach.map((approach) => (
                  <Badge key={approach} variant="secondary" className="capitalize text-xs">
                    {approach}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3 border-t border-border pt-4">
            <Link
              href={`/profesionales/${prof.id}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Ver perfil público
            </Link>
            <Link
              href="/paciente/tratamiento"
              className={buttonVariants({ variant: 'default', size: 'sm' })}
            >
              Ver estado del tratamiento
            </Link>
            <Link
              href="/paciente/mensajes"
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            >
              <Icon icon={icons.MessageSquare} size="sm" data-icon="inline-start" />
              Enviar mensaje
            </Link>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
