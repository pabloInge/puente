'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, FileText, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useSesionPaciente,
  guardarSesion,
  formatFechaLarga,
  formatHora,
  formatPesos,
  PROFESIONALES_MOCK,
} from '@/lib/puente-demo'

export default function MasPage() {
  const router = useRouter()
  const sesion = useSesionPaciente()

  if (!sesion?.panel) return null
  const { panel } = sesion
  const pro = PROFESIONALES_MOCK.find((p) => p.id === panel.profesionalId) ?? PROFESIONALES_MOCK[0]

  const ahora = Date.now()
  const proximos = [...panel.sesiones]
    .filter((s) => new Date(s.fecha).getTime() > ahora)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const pasadas = [...panel.sesiones]
    .filter((s) => new Date(s.fecha).getTime() <= ahora)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  const proxima = proximos[0]

  const aliasTransferencia = `${pro.nombre}.${pro.apellido}.psi`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  const handleBorrarDatos = () => {
    if (window.confirm('Se borra todo lo que guardaste en este dispositivo. ¿Seguimos?')) {
      guardarSesion(null)
      router.push('/')
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-azul md:text-4xl">
        Más
      </h1>

      {/* Acceso a informe */}
      <Link
        href="/mi/informe"
        className="flex items-center gap-4 rounded-3xl border border-linea bg-card p-5 transition-colors hover:border-azul/40"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-rosa-claro text-azul">
          <FileText className="size-6" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="font-bold text-tinta">Exportar mi informe</span>
          <span className="text-pretty text-sm leading-relaxed text-gris">
            Tu recorrido es tuyo. Llevalo si querés cambiar de profesional.
          </span>
        </span>
        <ArrowRight className="size-5 text-azul" aria-hidden="true" />
      </Link>

      {/* Turnos */}
      <section className="flex flex-col gap-4 rounded-3xl border border-linea bg-card p-5">
        <h2 className="text-lg font-bold text-tinta">Turnos</h2>
        <ul className="flex flex-col divide-y divide-linea">
          {proximos.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
              <span className="flex flex-col">
                <span className="font-medium text-tinta first-letter:uppercase">
                  {formatFechaLarga(s.fecha)}
                </span>
                <span className="text-sm text-gris">
                  {formatHora(s.fecha)} hs · {s.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
                </span>
              </span>
              <span className="rounded-full bg-azul/10 px-3 py-1 text-xs font-medium text-azul">
                Confirmado
              </span>
            </li>
          ))}

          {pasadas.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-3 last:pb-0">
              <span className="flex flex-col">
                <span className="text-tinta/80 first-letter:uppercase">
                  {formatFechaLarga(s.fecha)}
                </span>
                <span className="text-sm text-gris">{formatHora(s.fecha)} hs</span>
              </span>
              <span className="text-xs text-gris">Realizada</span>
            </li>
          ))}
        </ul>

        <p className="text-sm text-gris">
          Para cambiar o cancelar un turno, escribile a tu profesional con al menos 24 hs.
        </p>
      </section>

      {/* Pagos */}
      <section className="flex flex-col gap-4 rounded-3xl border border-linea bg-card p-5">
        <h2 className="text-lg font-bold text-tinta">Pagos</h2>
        <ul className="flex flex-col divide-y divide-linea">
          {proxima && (
            <li className="flex items-center justify-between gap-3 py-3 first:pt-0">
              <span className="flex flex-col">
                <span className="font-medium text-tinta">Próxima sesión</span>
                <span className="text-sm text-gris first-letter:uppercase">
                  {formatFechaLarga(proxima.fecha)}
                </span>
              </span>
              <span className="font-semibold tabular-nums text-tinta">
                {formatPesos(pro.honorario)}
              </span>
            </li>
          )}

          {pasadas.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-3 last:pb-0">
              <span className="text-tinta/80 first-letter:uppercase">
                {formatFechaLarga(s.fecha)}
              </span>
              <div className="flex items-center gap-3">
                <span className="tabular-nums text-gris">{formatPesos(pro.honorario)}</span>
                <span className="text-xs text-gris">Pagado</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-1 rounded-2xl bg-muted/60 p-4">
          <span className="text-sm text-gris">Pagás directo a tu profesional por transferencia</span>
          <span className="font-mono text-tinta font-semibold">{aliasTransferencia}</span>
        </div>
      </section>

      {/* Ayuda */}
      <section className="flex flex-col gap-4 rounded-3xl border border-linea bg-card p-5">
        <h2 className="text-lg font-bold text-tinta">Ayuda</h2>
        <p className="leading-relaxed text-tinta">
          Si estás en peligro o sentís que podés hacerte daño, llamá ahora.
        </p>
        <ul className="flex flex-col gap-2">
          {[
            { tel: '911', nombre: '911', detalle: 'Emergencias' },
            { tel: '107', nombre: '107', detalle: 'Emergencias médicas (SAME)' },
            { tel: '08009990091', nombre: '0800 999 0091', detalle: 'Línea de Salud Mental · 24 hs' },
          ].map((item) => (
            <li key={item.tel}>
              <a
                href={`tel:${item.tel}`}
                className="flex min-h-12 items-center gap-3 rounded-xl border border-linea bg-card px-4 text-tinta hover:border-azul/40"
              >
                <Phone className="size-4 text-azul" />
                <span className="flex-1 text-sm font-semibold">{item.nombre}</span>
                <span className="text-xs text-gris">{item.detalle}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <Button
        variant="ghost"
        className="self-start text-gris hover:text-destructive"
        onClick={handleBorrarDatos}
      >
        Borrar mis datos de este dispositivo
      </Button>
    </>
  )
}
