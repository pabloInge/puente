import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { listBondRequestsForProfessional } from '@/lib/services/bonds'
import { getSession } from '@/lib/session'
import { BondRequestsView } from '@/components/domain/bond/bond-requests-view'

export const metadata: Metadata = {
  title: 'Solicitudes de vínculo — Puente',
}

export default async function ProfessionalRequestsPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'professional') {
    redirect('/ingresar')
  }

  const requests = await listBondRequestsForProfessional(session)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Solicitudes de vínculo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisá las solicitudes de pacientes y decidí si aceptar iniciar el vínculo terapéutico.
        </p>
      </div>

      <BondRequestsView requests={requests} />
    </div>
  )
}
