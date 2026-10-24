import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { listClinicalTemplates } from '@/lib/services/clinical'
import { getSession } from '@/lib/session'
import { ClinicalTemplatesView } from '@/components/domain/clinical/clinical-templates-view'

export const metadata: Metadata = {
  title: 'Plantillas de Historia Clínica — Puente',
}

export default async function ProfessionalTemplatesPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'professional') {
    redirect('/ingresar')
  }

  const templates = await listClinicalTemplates(session)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Plantillas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estandarizá la carga de tus historias clínicas con formatos reutilizables.
        </p>
      </div>

      <ClinicalTemplatesView templates={templates} />
    </div>
  )
}
