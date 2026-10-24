'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  useSesionPaciente,
  updatePanel,
  formatFechaLarga,
  Objetivo,
  Ejercicio,
} from '@/lib/puente-demo'

function ObjetivoItem({ obj }: { obj: Objetivo }) {
  const actual = obj.progreso.at(-1) ?? null

  const handleRating = (r: number) => {
    updatePanel((p) => ({
      ...p,
      objetivos: p.objetivos.map((o) =>
        o.id === obj.id ? { ...o, progreso: [...o.progreso, r] } : o
      ),
    }))
    toast.success('Anotado. Podés actualizarlo cuando quieras.')
  }

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-1">
        <p className="text-pretty font-semibold leading-relaxed text-tinta">
          {obj.texto}
        </p>
        <span className="text-xs text-gris">
          {obj.origen === 'primera charla' ? 'De tu primera charla' : 'Con tu profesional'}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-gris">¿Cómo vas con esto?</span>
        <div role="radiogroup" className="flex gap-2">
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              key={val}
              type="button"
              role="radio"
              aria-checked={actual === val}
              onClick={() => handleRating(val)}
              className={`flex size-11 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-colors ${
                actual === val
                  ? 'border-azul bg-azul text-white'
                  : 'border-linea text-azul hover:border-azul/50'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
        {obj.progreso.length > 1 && (
          <p className="text-xs text-gris">
            Antes: {obj.progreso.slice(0, -1).join(' → ')}
          </p>
        )}
      </div>
    </li>
  )
}

function EjercicioItem({ ej }: { ej: Ejercicio }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(ej.quePaso ?? '')

  const handleGuardar = () => {
    updatePanel((p) => ({
      ...p,
      ejercicios: p.ejercicios.map((item) =>
        item.id === ej.id
          ? { ...item, quePaso: texto.trim(), fecha: new Date().toISOString() }
          : item
      ),
    }))
    setEditando(false)
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-tinta">{ej.titulo}</h3>
        <p className="text-pretty leading-relaxed text-tinta/80">{ej.detalle}</p>
      </div>

      {editando ? (
        <div className="flex flex-col gap-2">
          <textarea
            rows={3}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Contá cómo te fue, sin importar si salió o no."
            className="rounded-xl border border-azul/20 bg-card p-3 text-base text-tinta outline-none focus-visible:border-azul"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleGuardar} disabled={!texto.trim()}>
              Guardar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : ej.quePaso ? (
        <div className="flex flex-col gap-1 border-l-2 border-rosa pl-3">
          <span className="text-xs text-gris">¿Qué pasó?</span>
          <p className="leading-relaxed text-tinta">{ej.quePaso}</p>
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="self-start text-sm font-semibold text-azul"
          >
            Editar
          </button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="self-start bg-card"
          onClick={() => setEditando(true)}
        >
          ¿Qué pasó?
        </Button>
      )}
    </li>
  )
}

export default function ProcesoPage() {
  const sesion = useSesionPaciente()
  const [nuevoObj, setNuevoObj] = useState('')

  if (!sesion?.panel) return null
  const { panel } = sesion

  const sesionesPasadas = [...panel.sesiones]
    .filter((s) => new Date(s.fecha).getTime() <= Date.now())
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  const handleCrearObjetivo = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = nuevoObj.trim()
    if (!clean) return

    updatePanel((p) => ({
      ...p,
      objetivos: [
        ...p.objetivos,
        {
          id: Math.random().toString(36).slice(2, 9),
          texto: clean,
          origen: 'con tu profesional',
          progreso: [],
        },
      ],
    }))
    setNuevoObj('')
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-azul md:text-4xl">
        Mi proceso
      </h1>

      {/* Objetivos */}
      <section className="flex flex-col gap-4 rounded-3xl border border-linea bg-card p-5">
        <h2 className="text-lg font-bold text-tinta">Objetivos</h2>
        <ul className="flex flex-col divide-y divide-linea">
          {panel.objetivos.map((obj) => (
            <ObjetivoItem key={obj.id} obj={obj} />
          ))}
        </ul>

        <form onSubmit={handleCrearObjetivo} className="flex gap-2 pt-2">
          <input
            type="text"
            value={nuevoObj}
            onChange={(e) => setNuevoObj(e.target.value)}
            placeholder="Un objetivo que hablaste en sesión"
            className="h-12 flex-1 rounded-xl border border-azul/20 bg-background px-4 text-sm text-tinta outline-none focus-visible:border-azul"
          />
          <Button
            type="submit"
            size="lg"
            variant="outline"
            className="h-12 gap-1.5"
            disabled={!nuevoObj.trim()}
          >
            <Plus className="size-4" />
            <span className="sr-only sm:not-sr-only">Agregar</span>
          </Button>
        </form>
      </section>

      {/* Para practicar esta semana */}
      <section className="flex flex-col gap-4 rounded-3xl border border-linea bg-card p-5">
        <h2 className="text-lg font-bold text-tinta">Para practicar esta semana</h2>
        <ul className="flex flex-col gap-4">
          {panel.ejercicios.map((ej) => (
            <EjercicioItem key={ej.id} ej={ej} />
          ))}
        </ul>
      </section>

      {/* Después de cada sesión */}
      <section className="flex flex-col gap-4 rounded-3xl border border-linea bg-card p-5">
        <h2 className="text-lg font-bold text-tinta">Después de cada sesión</h2>
        <ul className="flex flex-col gap-4">
          {sesionesPasadas.map((s) => (
            <li key={s.id} className="flex flex-col gap-1">
              <span className="text-sm text-gris first-letter:uppercase">
                {formatFechaLarga(s.fecha)}
              </span>
              {s.meLlevo ? (
                <p className="text-pretty leading-relaxed text-tinta">“{s.meLlevo}”</p>
              ) : (
                <p className="text-sm text-gris">No registraste nada de esta sesión.</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
