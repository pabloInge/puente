'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Frown,
  Laugh,
  MapPin,
  Meh,
  Smile,
  Star,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  useSesionPaciente,
  updatePanel,
  formatFechaLarga,
  formatHora,
  PROFESIONALES_MOCK,
} from '@/lib/puente-demo'

const CARITAS_ANIMO = [
  { valor: 1, icon: Frown, label: 'Muy mal' },
  { valor: 2, icon: Frown, label: 'Mal' },
  { valor: 3, icon: Meh, label: 'Más o menos' },
  { valor: 4, icon: Smile, label: 'Bien' },
  { valor: 5, icon: Laugh, label: 'Muy bien' },
]

export default function MiEspacioPage() {
  const router = useRouter()
  const sesion = useSesionPaciente()
  const [queMeLlevo, setQueMeLlevo] = useState('')

  if (!sesion?.panel) {
    return <div className="min-h-96" aria-busy="true" />
  }

  const { panel, contacto } = sesion
  const nombre = contacto?.nombre ?? 'vos'
  const pro = PROFESIONALES_MOCK.find((p) => p.id === panel.profesionalId) ?? PROFESIONALES_MOCK[0]

  const ahora = Date.now()
  const proximaSesion = [...panel.sesiones]
    .filter((s) => new Date(s.fecha).getTime() > ahora)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0]

  const ultimasSesiones = [...panel.sesiones]
    .filter((s) => new Date(s.fecha).getTime() <= ahora)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
  const ultimaSesion = ultimasSesiones[0]

  const mostrarQueMeLlevo =
    ultimaSesion &&
    !ultimaSesion.meLlevo &&
    ahora - new Date(ultimaSesion.fecha).getTime() < 2 * 86400 * 1000

  const temasProximaSesion = panel.entradas.filter((e) => e.paraSesion)

  const handleGuardarQueMeLlevo = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = queMeLlevo.trim()
    if (!clean || !ultimaSesion) return

    updatePanel((p) => ({
      ...p,
      sesiones: p.sesiones.map((s) =>
        s.id === ultimaSesion.id ? { ...s, meLlevo: clean } : s
      ),
    }))
    setQueMeLlevo('')
    toast.success('Guardado en Mi proceso.')
  }

  return (
    <>
      <h1 className="text-balance text-3xl font-bold tracking-tight text-azul md:text-4xl">
        Hola, {nombre}
      </h1>

      {/* Próxima sesión */}
      {proximaSesion && (
        <section
          aria-labelledby="proxima-sesion-title"
          className="flex flex-col gap-5 rounded-3xl bg-azul p-5 text-white"
        >
          <h2 id="proxima-sesion-title" className="text-sm font-medium opacity-80">
            Tu próxima sesión
          </h2>
          <div className="flex flex-col gap-1">
            <p className="text-2xl font-bold first-letter:uppercase">
              {formatFechaLarga(proximaSesion.fecha)}
            </p>
            <p className="text-lg opacity-90">
              {formatHora(proximaSesion.fecha)} hs ·{' '}
              {proximaSesion.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Image
              src={pro.foto}
              alt=""
              width={44}
              height={44}
              className="size-11 rounded-full object-cover"
            />
            <span className="font-semibold">
              Lic. {pro.nombre} {pro.apellido}
            </span>
          </div>

          {proximaSesion.modalidad === 'virtual' ? (
            <Button
              variant="secondary"
              size="lg"
              className="h-12 bg-papel text-azul hover:bg-papel/90 gap-2 font-semibold"
              onClick={() => toast.info('El link para entrar se habilita 10 minutos antes.')}
            >
              <Video className="size-4" />
              Unirme
            </Button>
          ) : (
            <a
              href="https://www.google.com/maps/search/?api=1&query=Rosario+Santa+Fe"
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-papel font-semibold text-azul transition-colors hover:bg-papel/90"
            >
              <MapPin className="size-4" />
              Cómo llegar
            </a>
          )}
        </section>
      )}

      {/* Caja ¿Qué te llevás de hoy? */}
      {mostrarQueMeLlevo && (
        <section
          aria-labelledby="llevo-sesion-title"
          className="flex flex-col gap-3 rounded-3xl bg-rosa-claro p-5"
        >
          <h2 id="llevo-sesion-title" className="text-lg font-bold text-tinta">
            ¿Qué te llevás de hoy?
          </h2>
          <p className="text-sm text-tinta/80">Una línea alcanza. Es opcional.</p>
          <form onSubmit={handleGuardarQueMeLlevo} className="flex gap-2">
            <input
              type="text"
              value={queMeLlevo}
              onChange={(e) => setQueMeLlevo(e.target.value)}
              placeholder="Por ejemplo: que no tengo que resolver todo hoy"
              className="h-12 flex-1 rounded-xl border border-azul/20 bg-card px-4 text-sm text-tinta outline-none focus-visible:border-azul"
            />
            <Button type="submit" size="lg" className="h-12" disabled={!queMeLlevo.trim()}>
              Guardar
            </Button>
          </form>
        </section>
      )}

      {/* ¿Cómo estás hoy? */}
      <section className="flex flex-col gap-4 rounded-3xl border border-linea bg-card p-5">
        <h2 className="text-lg font-bold text-tinta">¿Cómo estás hoy?</h2>
        <div className="flex items-center justify-between gap-2">
          {CARITAS_ANIMO.map(({ valor, icon: Icon, label }) => (
            <button
              key={valor}
              type="button"
              aria-label={label}
              onClick={() => router.push(`/mi/diario?escribir=${valor}`)}
              className="flex size-14 items-center justify-center rounded-full border border-linea text-azul transition-colors hover:border-azul hover:bg-azul/5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Icon className="size-7" strokeWidth={1.5} />
            </button>
          ))}
        </div>
        <p className="leading-relaxed text-gris">
          ¿Querés contar cómo vienen estos días?
        </p>
      </section>

      {/* Para la próxima sesión */}
      <section className="flex flex-col gap-4 rounded-3xl border border-linea bg-card p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-tinta">Para la próxima sesión</h2>
          <span className="text-sm text-gris">
            {temasProximaSesion.length === 1
              ? '1 tema'
              : `${temasProximaSesion.length} temas`}
          </span>
        </div>

        {temasProximaSesion.length === 0 ? (
          <p className="leading-relaxed text-gris">
            Cuando escribas en el diario, marcá con la estrella lo que quieras hablar en sesión.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {temasProximaSesion.slice(0, 4).map((item) => (
              <li key={item.id} className="flex gap-3">
                <Star className="mt-1 size-4 shrink-0 fill-rosa text-rosa" aria-hidden="true" />
                <p className="line-clamp-2 leading-relaxed text-tinta">{item.texto}</p>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/mi/diario"
          className="flex items-center gap-1 self-start text-sm font-semibold text-azul"
        >
          Ir al diario
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </>
  )
}
