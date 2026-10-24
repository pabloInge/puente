'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'

type AdminUser = {
  id: string
  name: string
  email: string
  role: 'patient' | 'professional' | 'admin'
  status: 'active' | 'suspended'
  emailVerified: boolean
  createdAt: Date | string
}

export function UsersView({ initialUsers }: { initialUsers: AdminUser[] }) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  async function handleToggleStatus(user: AdminUser) {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active'
    const confirmMsg =
      nextStatus === 'suspended'
        ? `¿Suspender la cuenta de ${user.name}? El usuario perderá acceso al sistema.`
        : `¿Reactivar la cuenta de ${user.name}?`

    if (!confirm(confirmMsg)) return

    setLoadingId(user.id)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status: nextStatus }),
      })
      if (res.ok) {
        setUsers(
          users.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)),
        )
      }
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Gestión de usuarios</h2>
          <p className="text-sm text-muted-foreground">
            Cuentas, estados y suspensión administrativa (CU-G-06 · Sin acceso a datos clínicos).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-56"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border border-border bg-background p-2 text-sm"
          >
            <option value="all">Todos los roles</option>
            <option value="patient">Pacientes</option>
            <option value="professional">Profesionales</option>
            <option value="admin">Administradores</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-xs font-semibold text-muted-foreground uppercase">
                <th className="p-3 pl-4">Usuario</th>
                <th className="p-3">Email</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Alta</th>
                <th className="p-3 pr-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-surface-2/20">
                  <td className="p-3 pl-4 font-medium text-foreground">{u.name}</td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs uppercase">
                      {u.role === 'patient' ? 'Paciente' : u.role === 'professional' ? 'Profesional' : 'Admin'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {u.status === 'active' ? (
                      <Badge className="bg-emerald-600 text-white text-xs">Activo</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Suspendido</Badge>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="p-3 pr-4 text-right">
                    {u.role !== 'admin' && (
                      <Button
                        size="sm"
                        variant={u.status === 'active' ? 'outline' : 'secondary'}
                        onClick={() => handleToggleStatus(u)}
                        disabled={loadingId === u.id}
                        className={u.status === 'active' ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600'}
                      >
                        {loadingId === u.id
                          ? 'Actualizando...'
                          : u.status === 'active'
                          ? 'Suspender'
                          : 'Reactivar'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
