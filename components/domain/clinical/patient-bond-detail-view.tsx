'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'
import type { TimelineEvent } from '@/lib/timeline/types'

type PatientBondDetailViewProps = {
  bondId: string
  bondStatus: string
  patient: {
    firstName: string
    lastName: string
    dni: string | null
    phone: string | null
    city: string | null
    province: string | null
    emergencyContactName: string | null
    emergencyContactPhone: string | null
    initialTopics: string | null
  }
  timeline: TimelineEvent[]
}

export function PatientBondDetailView({
  bondId,
  bondStatus,
  patient,
  timeline,
}: PatientBondDetailViewProps) {
  const isActive = bondStatus === 'active'

  return (
    <div className="flex flex-col gap-6">
      {/* Patient Header Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl text-foreground">
                {patient.firstName} {patient.lastName}
              </CardTitle>
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'Tratamiento activo (R-02)' : 'Vínculo finalizado (R-03)'}
              </Badge>
            </div>
            {patient.city && (
              <p className="text-xs text-muted-foreground mt-1">
                {patient.city}, {patient.province}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/profesional/pacientes/${bondId}/historia-clinica`}
              className={buttonVariants({ size: 'sm', variant: 'default' })}
            >
              <Icon icon={icons.FileText} size="sm" data-icon="inline-start" />
              Historia clínica
            </Link>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
          <div>
            <span className="text-xs text-muted-foreground block">DNI</span>
            <span className="font-medium text-foreground">
              {patient.dni ? patient.dni : 'No disponible'}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Contacto</span>
            <span className="font-medium text-foreground">{patient.phone ?? 'No informado'}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Contacto de emergencia</span>
            <span className="font-medium text-foreground">
              {patient.emergencyContactName ? `${patient.emergencyContactName} (${patient.emergencyContactPhone})` : 'No registrado'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-foreground">Línea de tiempo cronológica</h3>

        {timeline.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No hay eventos registrados en la línea de tiempo aún.
          </div>
        ) : (
          <div className="relative border-l-2 border-border ml-4 space-y-6 pl-6 py-2">
            {timeline.map((event) => (
              <div key={event.id} className="relative group">
                <span className="absolute -left-[31px] top-1 flex size-4 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{event.title}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  {event.summary && (
                    <p className="text-xs text-muted-foreground">{event.summary}</p>
                  )}
                  {event.href && (
                    <Link
                      href={event.href}
                      className="text-xs font-medium text-primary hover:underline mt-1 w-fit"
                    >
                      Ver detalle →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
