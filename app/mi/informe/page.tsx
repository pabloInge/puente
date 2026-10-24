'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Link2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { PuenteLogoIcon, PuenteLogoText } from '@/components/layout/brand'
import { toast } from 'sonner'
import {
  useSesionPaciente,
  updatePanel,
  updateSesion,
  formatFechaLarga,
  formatFechaCorta,
  PROFESIONALES_MOCK,
  EntradaDiario,
} from '@/lib/puente-demo'

const SECCIONES_INFORME = [
  { id: 'resumen', label: 'Resumen de la primera charla' },
  { id: 'objetivos', label: 'Objetivos y cómo fueron evolucionando' },
  { id: 'animo', label: 'Línea de ánimo de los últimos meses' },
  { id: 'entradas', label: 'Entradas del diario que elijas' },
  { id: 'ejercicios', label: 'Ejercicios practicados y qué pasó' },
  { id: 'derivacion', label: 'Nota de derivación de tu profesional' },
]

export default function InformePage() {
  const router = useRouter()
  const sesion = useSesionPaciente()
  const [partes, setPartes] = useState<Set<string>>(
    new Set(['resumen', 'objetivos', 'animo', 'ejercicios'])
  )
  const [entradasSel, setEntradasSel] = useState<Set<string>>(new Set())

  if (!sesion?.panel) return null
  const { panel, contacto, chat } = sesion
  const nombre = contacto?.nombre ?? 'vos'
  const pro = PROFESIONALES_MOCK.find((p) => p.id === panel.profesionalId) ?? PROFESIONALES_MOCK[0]
  const derivacion = panel.derivacion

  const toggleParte = (id: string, checked: boolean) => {
    setPartes((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleEntrada = (id: string, checked: boolean) => {
    setEntradasSel((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handlePedirDerivacion = () => {
    updatePanel((p) => ({
      ...p,
      derivacion: { estado: 'pedida', pedidaEn: new Date().toISOString() },
    }))
    toast.success(`Le avisamos a ${pro.nombre}. Cuando la apruebe, aparece acá.`)
  }

  const handleCopiarLink = async () => {
    const url = `https://puente.app/i/${sesion.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado. Vence en 7 días.')
    } catch {
      toast.info(`Tu link: ${url}`, { description: 'Vence en 7 días.' })
    }
  }

  const handleBuscarOtro = () => {
    updateSesion((s) => ({
      ...s,
      etapa: 'cards',
      conInforme: true,
      vistos: [],
      elegidos: [],
    }))
    router.push('/consulta')
  }

  const entradasParaInforme = panel.entradas.filter((e) => entradasSel.has(e.id))
  const ejerciciosConRegistro = panel.ejercicios.filter((e) => e.quePaso)

  return (
    <>
      <div className="flex flex-col gap-2 print:hidden">
        <Link
          href="/mi/mas"
          className="flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-azul"
        >
          <ArrowLeft className="size-4" />
          Más
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-azul md:text-4xl">
          Exportar mi informe
        </h1>
        <p className="text-pretty leading-relaxed text-tinta">
          Elegí qué incluir. Tus notas privadas y las de tu profesional nunca se exportan solas.
        </p>
      </div>

      {/* Selector de qué incluir */}
      <fieldset className="flex flex-col gap-1 rounded-3xl border border-linea bg-card p-2 print:hidden">
        <legend className="sr-only">Qué incluir</legend>
        {SECCIONES_INFORME.map(({ id, label }) => {
          const deshabilitado = id === 'derivacion' && derivacion.estado !== 'aprobada'
          return (
            <div key={id} className="flex flex-col">
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl px-3 hover:bg-muted/60">
                <Checkbox
                  checked={partes.has(id) && !deshabilitado}
                  disabled={deshabilitado}
                  onCheckedChange={(val) => toggleParte(id, !!val)}
                />
                <span className={deshabilitado ? 'text-gris' : 'text-tinta'}>{label}</span>
              </label>

              {id === 'derivacion' && derivacion.estado !== 'aprobada' && (
                <div className="flex items-center justify-between gap-3 px-3 pb-2 pl-10">
                  {derivacion.estado === 'pedida' ? (
                    <span className="text-sm text-gris">
                      La pediste. Esperando que {pro.nombre} la apruebe.
                    </span>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handlePedirDerivacion}>
                      Pedir nota de derivación
                    </Button>
                  )}
                </div>
              )}

              {id === 'entradas' && partes.has('entradas') && (
                <ul className="flex flex-col gap-1 pb-2 pl-10 pr-2">
                  {panel.entradas.map((e) => (
                    <li key={e.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl p-2 hover:bg-muted/60">
                        <Checkbox
                          className="mt-1"
                          checked={entradasSel.has(e.id)}
                          onCheckedChange={(val) => toggleEntrada(e.id, !!val)}
                        />
                        <span className="flex flex-col">
                          <span className="text-xs text-gris">
                            {formatFechaCorta(e.fecha)}
                          </span>
                          <span className="line-clamp-2 text-sm text-tinta">{e.texto}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </fieldset>

      <h2 className="text-sm font-medium text-gris print:hidden">Vista previa</h2>

      {/* Vista previa imprimible */}
      <article className="flex flex-col gap-8 rounded-3xl border border-linea bg-card p-6 md:p-10 print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-col gap-6 border-b border-linea pb-6">
          <div className="flex items-end gap-2">
            <PuenteLogoIcon className="mb-1 h-5" />
            <PuenteLogoText />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-azul">Informe de {nombre}</h2>
            <p className="text-sm text-gris first-letter:uppercase">
              {formatFechaLarga(new Date())}
            </p>
          </div>
        </header>

        {partes.has('resumen') && chat.resumen && (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-azul">Primera charla</h3>
            <p className="leading-relaxed text-tinta">{chat.resumen.texto}</p>
            {chat.resumen.temas.length > 0 && (
              <p className="text-sm text-gris">
                Temas: {chat.resumen.temas.join(', ')}
              </p>
            )}
          </section>
        )}

        {partes.has('objetivos') && panel.objetivos.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-azul">Objetivos</h3>
            <ul className="flex flex-col gap-3">
              {panel.objetivos.map((obj) => (
                <li key={obj.id} className="flex flex-col gap-0.5">
                  <span className="text-tinta">{obj.texto}</span>
                  <span className="text-sm tabular-nums text-gris">
                    {obj.progreso.length
                      ? `Cómo fue: ${obj.progreso.join(' → ')} (de 5)`
                      : 'Sin registrar todavía'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {partes.has('entradas') && entradasParaInforme.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-azul">Del diario</h3>
            <ul className="flex flex-col gap-3">
              {entradasParaInforme.map((e) => (
                <li key={e.id} className="flex flex-col gap-1">
                  <span className="text-sm text-gris">
                    {formatFechaLarga(e.fecha)}
                  </span>
                  <p className="leading-relaxed text-tinta">{e.texto}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {partes.has('ejercicios') && ejerciciosConRegistro.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-azul">Ejercicios practicados</h3>
            <ul className="flex flex-col gap-3">
              {ejerciciosConRegistro.map((ej) => (
                <li key={ej.id} className="flex flex-col gap-1">
                  <span className="font-medium text-tinta">{ej.titulo}</span>
                  <p className="leading-relaxed text-tinta/80">Qué pasó: {ej.quePaso}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {partes.has('derivacion') &&
          derivacion.estado === 'aprobada' &&
          derivacion.texto && (
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-azul">Nota de derivación</h3>
              <p className="whitespace-pre-line leading-relaxed text-tinta">
                {derivacion.texto}
              </p>
            </section>
          )}

        <footer className="border-t border-linea pt-4 text-xs leading-relaxed text-gris">
          Informe generado por el paciente desde Puente. No es un diagnóstico ni reemplaza la historia clínica.
        </footer>
      </article>

      {/* Acciones */}
      <div className="flex flex-col gap-2 print:hidden">
        <Button size="lg" className="h-14 text-base gap-2" onClick={() => window.print()}>
          <Download className="size-5" />
          Descargar PDF
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 text-base gap-2"
          onClick={handleCopiarLink}
        >
          <Link2 className="size-5" />
          Compartir por link
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className="h-14 text-base text-azul gap-2"
          onClick={handleBuscarOtro}
        >
          <Search className="size-5" />
          Buscar otro profesional en Puente
        </Button>
      </div>
    </>
  )
}
