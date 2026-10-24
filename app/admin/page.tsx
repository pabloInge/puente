import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'
import { routes } from '@/lib/navigation'
import {
  listAuditLogsAdmin,
  listBranchesAdmin,
  listCoveragesAdmin,
  listUsersAdmin,
} from '@/lib/services/admin'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: routes.adminHome.label }

export default async function AdminHomePage() {
  const session = await getSession()
  if (!session) return null

  const branches = await listBranchesAdmin(session)
  const coverages = await listCoveragesAdmin(session)
  const users = await listUsersAdmin(session, { limit: 100 })
  const logs = await listAuditLogsAdmin(session, { limit: 10 })

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Panel de Administración
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestión centralizada de catálogos, políticas legales, usuarios y auditoría inmutable.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/ramas" className="group">
          <Card className="h-full transition-colors group-hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ramas y enfoques</CardTitle>
              <Icon icon={icons.Folder} size="sm" className="text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{branches.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Especialidades activas</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/coberturas" className="group">
          <Card className="h-full transition-colors group-hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Coberturas</CardTitle>
              <Icon icon={icons.CreditCard} size="sm" className="text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coverages.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Obras sociales y prepagas</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/usuarios" className="group">
          <Card className="h-full transition-colors group-hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios</CardTitle>
              <Icon icon={icons.Users} size="sm" className="text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Cuentas registradas</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/auditoria" className="group">
          <Card className="h-full transition-colors group-hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Auditoría</CardTitle>
              <Icon icon={icons.Shield} size="sm" className="text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Eventos recientes registrados</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Accesos directos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link
              href="/admin/consentimientos"
              className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-surface-2/40 text-sm font-medium"
            >
              <span>Consentimientos informados y términos legales</span>
              <Icon icon={icons.ChevronRight} size="sm" />
            </Link>
            <Link
              href="/admin/plantillas"
              className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-surface-2/40 text-sm font-medium"
            >
              <span>Plantillas globales de historia clínica</span>
              <Icon icon={icons.ChevronRight} size="sm" />
            </Link>
            <Link
              href="/admin/configuracion"
              className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-surface-2/40 text-sm font-medium"
            >
              <span>Parámetros y reglas de la plataforma</span>
              <Icon icon={icons.ChevronRight} size="sm" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Últimos eventos de auditoría</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {logs.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                <span className="font-mono text-muted-foreground">{l.action}</span>
                <span className="text-muted-foreground">{new Date(l.createdAt).toLocaleTimeString('es-AR')}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
