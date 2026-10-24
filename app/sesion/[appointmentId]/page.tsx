import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Icon, icons } from '@/components/ui/icon'
import { db } from '@/lib/db'
import {
  appointment,
  patientProfile,
  professionalProfile,
  serviceType,
  user,
} from '@/lib/db/schema'
import { getSession } from '@/lib/session'
import { joinUrl, videoProvider } from '@/lib/video'

type PageProps = {
  params: Promise<{ appointmentId: string }>
}

export const metadata: Metadata = {
  title: 'Sesión Online — Puente',
}

export default async function OnlineSessionPage({ params }: PageProps) {
  const { appointmentId } = await params
  const session = await getSession()

  if (!session) {
    redirect(`/ingresar?next=/sesion/${appointmentId}`)
  }

  const [apt] = await db
    .select({
      id: appointment.id,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      modality: appointment.modality,
      status: appointment.status,
      videoRoomName: appointment.videoRoomName,
      serviceName: serviceType.name,
      patientUserId: patientProfile.userId,
      patientName: user.name,
      professionalUserId: professionalProfile.userId,
      professionalName: professionalProfile.displayName,
    })
    .from(appointment)
    .innerJoin(serviceType, eq(appointment.serviceTypeId, serviceType.id))
    .innerJoin(patientProfile, eq(appointment.patientId, patientProfile.id))
    .innerJoin(user, eq(patientProfile.userId, user.id))
    .innerJoin(professionalProfile, eq(appointment.professionalId, professionalProfile.id))
    .where(eq(appointment.id, appointmentId))
    .limit(1)

  if (!apt) notFound()

  // 1. Authorization: Only the two participants are allowed (CU: C-09)
  const isPatient = session.user.id === apt.patientUserId
  const isProfessional = session.user.id === apt.professionalUserId

  if (!isPatient && !isProfessional) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
          <Icon icon={icons.ShieldAlert} size="md" />
        </span>
        <h1 className="text-xl font-bold text-foreground">Acceso no autorizado (403)</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Esta sala de sesión es privada y exclusiva para los participantes del turno.
        </p>
        <Link href="/" className={buttonVariants({ className: 'mt-6' })}>
          Volver al inicio
        </Link>
      </div>
    )
  }

  // 2. Timing check: 10 minutes before startsAt
  const now = new Date()
  const tenMinutesBefore = new Date(apt.startsAt.getTime() - 10 * 60 * 1000)
  const isTooEarly = now < tenMinutesBefore
  const isExpired = now > new Date(apt.endsAt.getTime() + 60 * 60 * 1000)

  // 3. Provider check
  let callUrl: string | null = null
  let providerWarning: string | null = null

  if (!videoProvider.isConfigured) {
    providerWarning =
      'El proveedor de videollamadas no tiene configurada la clave DAILY_API_KEY en el entorno. La sala de sesión permanece en modo de demostración.'
  } else if (!isTooEarly && !isExpired) {
    try {
      const room = await videoProvider.roomFor({
        id: apt.id,
        startsAt: apt.startsAt,
        endsAt: apt.endsAt,
      })

      const token = await videoProvider.tokenFor(
        {
          userId: session.user.id,
          displayName: isProfessional ? apt.professionalName : apt.patientName,
          isHost: isProfessional,
        },
        room,
        apt.endsAt,
      )

      callUrl = joinUrl(room, token)
    } catch (err: any) {
      providerWarning = err.message || 'No se pudo conectar a la sala de videollamada.'
    }
  }

  const otherName = isPatient ? apt.professionalName : apt.patientName
  const backHref = isPatient ? '/paciente/turnos' : '/profesional/agenda'

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Top Session Bar */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-surface-1 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Link href={backHref} className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'p-2' })}>
            <Icon icon={icons.ArrowLeft} size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-sm">{apt.serviceName}</span>
            <span className="text-xs text-muted-foreground">con {otherName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {new Date(apt.startsAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} -{' '}
            {new Date(apt.endsAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </Badge>
          <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
            {apt.status === 'confirmed' ? 'Confirmado' : apt.status}
          </Badge>
        </div>
      </header>

      {/* Main Video Area */}
      <main className="relative flex flex-1 items-center justify-center bg-black/95">
        {isTooEarly ? (
          <div className="flex max-w-md flex-col items-center justify-center p-8 text-center text-white">
            <span className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white mb-4">
              <Icon icon={icons.Clock} size="md" />
            </span>
            <h2 className="text-xl font-semibold">La sala aún no está abierta</h2>
            <p className="mt-2 text-sm text-white/70">
              Podrás ingresar a la sesión a partir de 10 minutos antes del horario pactado (
              {tenMinutesBefore.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}).
            </p>
            <Link href={backHref} className={buttonVariants({ variant: 'outline', className: 'mt-6 bg-white/10 text-white border-white/20' })}>
              Volver a mis turnos
            </Link>
          </div>
        ) : providerWarning ? (
          <div className="flex max-w-md flex-col items-center justify-center p-8 text-center text-white">
            <span className="flex size-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 mb-4">
              <Icon icon={icons.Video} size="md" />
            </span>
            <h2 className="text-xl font-semibold">Aviso de videollamada</h2>
            <p className="mt-2 text-sm text-white/70">{providerWarning}</p>
            <Link href={backHref} className={buttonVariants({ variant: 'outline', className: 'mt-6 bg-white/10 text-white border-white/20' })}>
              Volver
            </Link>
          </div>
        ) : callUrl ? (
          <iframe
            src={callUrl}
            allow="camera; microphone; fullscreen; display-capture"
            className="h-full w-full border-0"
            title="Sala de videollamada"
          />
        ) : (
          <div className="text-sm text-white/70">Cargando sala de sesión...</div>
        )}
      </main>
    </div>
  )
}
