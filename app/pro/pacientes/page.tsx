'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Search, Users, Video, MapPin } from 'lucide-react'
import {
  useDemoProfesional,
  formatPesos,
  formatHora,
  formatFechaCorta,
  formatDiaSemana,
  nombreCompleto,
  iniciales,
} from '@/lib/puente-pro-demo'

const FILTROS_ESTADO = [
  { value: 'todos', label: 'Todos' },
  { value: 'activo', label: 'Activos' },
  { value: 'pausa', label: 'En pausa' },
  { value: 'alta', label: 'De alta' },
]

export default function PacientesPage() {
  const estadoPro = useDemoProfesional()
  const [query, setQuery] = useState('')
  const [filtro, setFiltro] = useState('todos')

  const pacientesConDatos = estadoPro.pacientes.map((p) => {
    const turnosPac = estadoPro.turnos.filter((t) => t.pacienteId === p.id)
    const proximo = turnosPac
      .filter((t) => new Date(t.inicio).getTime() >= Date.now() && t.estado !== 'cancelado')
      .sort((a, b) => a.inicio.localeCompare(b.inicio))[0]
    const sesionesRealizadas = turnosPac.filter((t) => t.estado === 'realizado').length
    const deuda = estadoPro.pagos
      .filter((pg) => pg.pacienteId === p.id && pg.estado === 'pendiente')
      .reduce((acc, pg) => acc + pg.monto, 0)

    return {
      ...p,
      proximoTurno: proximo,
      sesiones: sesionesRealizadas,
      deuda,
    }
  })

  const filtrados = pacientesConDatos.filter((p) => {
    if (filtro !== 'todos' && p.estado !== filtro) return false
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.apellido.toLowerCase().includes(q) ||
      p.motivoConsulta.toLowerCase().includes(q)
    )
  })

  const countPorEstado = (st: string) => {
    if (st === 'todos') return estadoPro.pacientes.length
    return estadoPro.pacientes.filter((p) => p.estado === st).length
  }

  const activosCount = countPorEstado('activo')

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Pacientes
        </h1>
        <p className="text-sm text-muted-foreground">
          {activosCount} activos de {estadoPro.pacientes.length} en total
        </p>
      </header>

      {/* Buscador y filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o motivo"
            className="h-11 w-full rounded-xl border border-input bg-card pr-3.5 pl-10 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div role="group" className="flex gap-1 overflow-x-auto rounded-xl bg-secondary p-1">
          {FILTROS_ESTADO.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltro(f.value)}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${
                filtro === f.value
                  ? 'bg-card text-tinta shadow-sm'
                  : 'text-muted-foreground hover:text-tinta'
              }`}
            >
              {f.label}
              <span className="text-xs tabular-nums text-muted-foreground">
                {countPorEstado(f.value)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista / tabla */}
      <section className="rounded-2xl bg-card ring-1 border-linea" aria-label="Lista de pacientes">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Users className="size-8 opacity-40" />
            <p className="font-medium text-foreground">Sin resultados</p>
            <p className="text-sm">
              {query ? `No encontramos pacientes con "${query}".` : 'No hay pacientes en este estado.'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_8rem_6.5rem_1.25rem] gap-4 border-b border-border px-5 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase md:grid">
              <span>Paciente</span>
              <span>Frecuencia</span>
              <span>Próxima sesión</span>
              <span className="text-right">Saldo</span>
              <span>Estado</span>
              <span />
            </div>

            <ul className="divide-y divide-border">
              {filtrados.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/pro/pacientes/${p.id}`}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 px-5 py-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_8rem_6.5rem_1.25rem] md:gap-4"
                  >
                    <span className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-heading font-semibold text-xs text-secondary-foreground">
                        {iniciales(p)}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-tinta">{nombreCompleto(p)}</span>
                        <span className="truncate text-sm text-muted-foreground">{p.motivoConsulta}</span>
                      </span>
                    </span>

                    <span className="hidden flex-col gap-0.5 text-sm md:flex">
                      <span className="text-tinta">
                        {p.frecuencia} · {p.sesiones} {p.sesiones === 1 ? 'sesión' : 'sesiones'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {p.modalidad === 'virtual' ? <Video className="size-3" /> : <MapPin className="size-3" />}
                        {p.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
                      </span>
                    </span>

                    <span className="hidden text-sm text-tinta md:block">
                      {p.proximoTurno ? (
                        <>
                          {formatDiaSemana(p.proximoTurno.inicio)} {formatFechaCorta(p.proximoTurno.inicio)} ·{' '}
                          <span className="tabular-nums">{formatHora(p.proximoTurno.inicio)}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Sin turno</span>
                      )}
                    </span>

                    <span
                      className={`col-start-3 row-start-1 text-right text-sm font-semibold tabular-nums md:col-auto md:row-auto ${
                        p.deuda > 0 ? 'text-rosa' : 'text-muted-foreground'
                      }`}
                    >
                      {p.deuda > 0 ? formatPesos(p.deuda) : 'Al día'}
                    </span>

                    <span className="col-span-3 pl-12 md:col-span-1 md:pl-0">
                      <span
                        className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium capitalize ${
                          p.estado === 'activo'
                            ? 'bg-secondary text-secondary-foreground'
                            : p.estado === 'pausa'
                            ? 'bg-warning-soft text-warning'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {p.estado}
                      </span>
                    </span>

                    <ChevronRight className="hidden size-4 text-muted-foreground md:block" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  )
}
