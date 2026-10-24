import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getMyAppointmentsForPatient } from '@/lib/services/agenda'
import { getOpenBondForPatient } from '@/lib/services/bond-access'
import { getSession } from '@/lib/session'
import { PatientAppointmentsView } from '@/components/domain/agenda/patient-appointments-view'

export const metadata: Metadata = {
  title: 'Mis Turnos — Puente',
}

export default async function PatientAppointmentsPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'patient') {
    redirect('/ingresar')
  }

  const appointments = await getMyAppointmentsForPatient(session)
  const openBond = await getOpenBondForPatient(session)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Mis turnos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Turnos programados, historial de sesiones y acceso a salas virtuales.
        </p>
      </div>

      <PatientAppointmentsView
        appointments={appointments}
        hasActiveBond={Boolean(openBond && openBond.status === 'active')}
      />
    </div>
  )
}
