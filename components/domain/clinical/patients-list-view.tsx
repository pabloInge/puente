'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'

type BondItem = {
  id: string
  status: string
  requestedAt: Date | string
  activatedAt: Date | string | null
  endedAt: Date | string | null
  patientFirstName: string
  patientLastName: string
  patientProvince: string | null
  patientCity: string | null
}

export function PatientsListView({
  bonds,
}: {
  bonds: BondItem[]
}) {
  const activeBonds = bonds.filter((b) => b.status === 'active')
  const endedBonds = bonds.filter((b) => b.status === 'ended')

  return (
    <div className="flex flex-col gap-8">
      {/* Active Patients */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-foreground">
          Pacientes en tratamiento activo ({activeBonds.length})
        </h2>

        {activeBonds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No tenés pacientes activos en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {activeBonds.map((b) => (
              <Card key={b.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-base text-foreground">
                      {b.patientFirstName} {b.patientLastName}
                    </CardTitle>
                    {b.patientCity && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {b.patientCity}, {b.patientProvince}
                      </p>
                    )}
                  </div>
                  <Badge variant="default" className="text-xs">
                    Activo
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  <span className="text-xs text-muted-foreground">
                    En tratamiento desde{' '}
                    {b.activatedAt ? new Date(b.activatedAt).toLocaleDateString('es-AR') : 'Recientemente'}
                  </span>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Link
                      href={`/profesional/pacientes/${b.id}`}
                      className={buttonVariants({ size: 'sm', variant: 'default' })}
                    >
                      <Icon icon={icons.User} size="sm" data-icon="inline-start" />
                      Ver ficha
                    </Link>
                    <Link
                      href={`/profesional/pacientes/${b.id}/historia-clinica`}
                      className={buttonVariants({ size: 'sm', variant: 'outline' })}
                    >
                      <Icon icon={icons.FileText} size="sm" data-icon="inline-start" />
                      Historia clínica
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Ended Patients */}
      {endedBonds.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            Procesos finalizados ({endedBonds.length})
          </h2>
          <div className="flex flex-col gap-2">
            {endedBonds.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-1 p-4 text-sm"
              >
                <div>
                  <span className="font-semibold text-foreground">
                    {b.patientFirstName} {b.patientLastName}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    Finalizado el {b.endedAt ? new Date(b.endedAt).toLocaleDateString('es-AR') : ''}
                  </span>
                </div>
                <Link
                  href={`/profesional/pacientes/${b.id}`}
                  className={buttonVariants({ size: 'sm', variant: 'ghost' })}
                >
                  Ver registro histórico (R-03)
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
