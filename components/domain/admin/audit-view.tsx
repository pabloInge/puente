'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, icons } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'

type AuditLogItem = {
  id: string
  actorUserId: string | null
  action: string
  entity: string
  entityId: string | null
  bondId: string | null
  ip: string | null
  createdAt: Date | string
}

export function AuditView({ initialLogs }: { initialLogs: AuditLogItem[] }) {
  const [logs] = useState(initialLogs)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.actorUserId && l.actorUserId.toLowerCase().includes(search.toLowerCase())) ||
      (l.entityId && l.entityId.toLowerCase().includes(search.toLowerCase()))
    const matchesEntity = entityFilter === 'all' || l.entity === entityFilter
    return matchesSearch && matchesEntity
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Registro de auditoría</h2>
          <p className="text-sm text-muted-foreground">
            Bitácora inmutable de lecturas y escrituras clínicas y administrativas (CU-G-07 · R-11).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por acción o actor..."
            className="w-56"
          />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-md border border-border bg-background p-2 text-sm"
          >
            <option value="all">Todas las entidades</option>
            <option value="clinical_entry">Historia clínica</option>
            <option value="clinical_record_copy">Copia de historia</option>
            <option value="user">Usuarios</option>
            <option value="bond">Vínculos</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-xs font-semibold text-muted-foreground uppercase">
                <th className="p-3 pl-4">Fecha y hora</th>
                <th className="p-3">Acción</th>
                <th className="p-3">Entidad</th>
                <th className="p-3">ID Entidad</th>
                <th className="p-3">Actor (User ID)</th>
                <th className="p-3 pr-4">IP / Vínculo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No se encontraron registros de auditoría coincidentes.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-surface-2/20 text-xs font-mono">
                    <td className="p-3 pl-4 text-muted-foreground">
                      {new Date(l.createdAt).toLocaleString('es-AR')}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="font-semibold text-foreground">
                        {l.action}
                      </Badge>
                    </td>
                    <td className="p-3 font-sans text-muted-foreground">{l.entity}</td>
                    <td className="p-3 text-muted-foreground">{l.entityId ? l.entityId.slice(0, 8) + '...' : '-'}</td>
                    <td className="p-3 text-muted-foreground">{l.actorUserId ? l.actorUserId.slice(0, 8) + '...' : 'Sistema'}</td>
                    <td className="p-3 pr-4 text-muted-foreground">
                      {l.ip ?? (l.bondId ? `Vínculo: ${l.bondId.slice(0, 8)}...` : '-')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
