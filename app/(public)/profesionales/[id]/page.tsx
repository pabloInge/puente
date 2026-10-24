import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'
import { getPublicProfessionalProfile } from '@/lib/services/profiles'
import { getSession } from '@/lib/session'
import { PublicProfileActions } from '@/components/domain/profile/public-profile-actions'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const prof = await getPublicProfessionalProfile(id)
    return {
      title: `${prof.displayName} — Puente`,
      description: prof.bio ?? 'Perfil profesional en Puente',
    }
  } catch {
    return { title: 'Profesional no encontrado' }
  }
}

export default async function ProfessionalPublicPage({ params }: PageProps) {
  const { id } = await params
  const session = await getSession()

  let prof
  try {
    prof = await getPublicProfessionalProfile(id)
  } catch {
    notFound()
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 lg:px-8">
      {/* Header Profile Card */}
      <div className="rounded-xl border border-border bg-surface-1 p-6 shadow-2 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {prof.displayName}
              </h1>
              <Badge variant={prof.licenseVerified ? 'default' : 'outline'} className="text-xs">
                {prof.licenseVerified ? 'Matrícula verificada' : 'Matrícula no verificada'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {prof.licenseJurisdiction ? `${prof.licenseJurisdiction} · ` : ''}
              {prof.licenseNumber ?? 'Matrícula no informada'}
            </p>
            {prof.province && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon icon={icons.MapPin} size="sm" />
                {prof.city ? `${prof.city}, ${prof.province}` : prof.province}
                {prof.address ? ` (${prof.address})` : ''}
              </p>
            )}
          </div>

          <div className="w-full sm:w-64">
            <PublicProfileActions
              professionalId={prof.id}
              professionalName={prof.displayName}
              userRole={session?.user?.role}
              isLoggedIn={Boolean(session)}
            />
          </div>
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left: Bio & Details */}
        <div className="flex flex-col gap-6 md:col-span-2">
          {prof.bio && (
            <Card>
              <CardHeader className="text-base font-semibold text-foreground">
                Sobre mi práctica
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {prof.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {prof.theoreticalApproach.length > 0 && (
            <Card>
              <CardHeader className="text-base font-semibold text-foreground">
                Enfoque teórico
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {prof.theoreticalApproach.map((approach) => (
                    <Badge key={approach} variant="secondary" className="capitalize">
                      {approach}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="text-base font-semibold text-foreground">
              Ramas y especialidades
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {prof.branches.map((b) => (
                  <div key={b.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium text-sm text-foreground">{b.name}</p>
                    {b.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Modality, Fees, Coverages */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-base font-semibold text-foreground">
              Modalidad de atención
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Icon
                  icon={prof.modality === 'online' ? icons.Video : icons.Building2}
                  size="sm"
                  className="text-primary"
                />
                <span className="font-medium text-foreground">
                  {prof.modality === 'online'
                    ? 'Atención exclusivamente online'
                    : prof.modality === 'in_person'
                      ? 'Atención presencial'
                      : 'Presencial y online'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {prof.acceptsNewPatients
                  ? 'Actualmente aceptando nuevos pacientes.'
                  : 'Cupo completo temporalmente.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-base font-semibold text-foreground">
              Honorarios
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="text-lg font-semibold text-foreground">
                {prof.feeMin ? (
                  prof.feeMax && prof.feeMax > prof.feeMin ? (
                    `$${prof.feeMin.toLocaleString('es-AR')} - $${prof.feeMax.toLocaleString('es-AR')}`
                  ) : (
                    `$${prof.feeMin.toLocaleString('es-AR')}`
                  )
                ) : (
                  'A convenir'
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor estimado por sesión o consulta particular.
              </p>
            </CardContent>
          </Card>

          {prof.coverages.length > 0 && (
            <Card>
              <CardHeader className="text-base font-semibold text-foreground">
                Obras sociales y programas
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {prof.coverages.map((c) => (
                  <div key={c.id} className="rounded-md border border-border p-2 text-xs">
                    <p className="font-medium text-foreground">{c.name}</p>
                    {c.notes && <p className="text-muted-foreground mt-0.5">{c.notes}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
