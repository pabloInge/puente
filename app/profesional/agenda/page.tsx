import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getMyAppointmentsForProfessional } from '@/lib/services/agenda'
import { getSession } from '@/lib/session'
import { ProfessionalAgendaView } from '@/components/domain/agenda/professional-agenda-view'

export const metadata: Metadata = {
  title: 'Mi Agenda — Puente',
}

export default async function ProfessionalAgendaPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'professional') {
    redirect('/ingresar')
  }

  const appointments = await getMyAppointmentsForProfessional(session)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Agenda</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestión de turnos de pacientes, solicitudes pendientes y acceso a sesiones online.
        </p>
      </div>

      <ProfessionalAgendaView appointments={appointments} />
    </div>
  )
}
