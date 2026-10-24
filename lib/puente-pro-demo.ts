'use client'

import { useSyncExternalStore } from 'react'
import {
  Paciente,
  Turno,
  Pago,
  NotaClinica,
  Solicitud,
  Profesional,
  PROFESIONALES_MOCK,
  mismoDia,
  inicioDelDia,
  inicioDeSemana,
  sumarDias,
  formatPesos,
  formatHora,
  formatFechaCorta,
  nombreCompleto,
  calcularEdad,
} from './puente-demo'

export interface EstadoDemoProfesional {
  version: number
  profesional: Profesional
  pacienteActualId: string
  pacientes: Paciente[]
  turnos: Turno[]
  notas: NotaClinica[]
  pagos: Pago[]
  animos: { id: string; pacienteId: string; fecha: string; valor: number; nota?: string }[]
  tareas: { id: string; pacienteId: string; titulo: string; detalle?: string; hecha: boolean }[]
  profesionales: Profesional[]
  solicitudes: Solicitud[]
}

const STORAGE_KEY_PRO = 'puente-demo-v1'
const DEMO_VERSION = 2

function generarDatosIniciales(): EstadoDemoProfesional {
  const ahora = new Date()
  const hoy = inicioDelDia(ahora)

  const iso = (d: Date) => d.toISOString()
  const horaMin = (base: Date, diasOffset: number, h: number, m: number) => {
    const d = sumarDias(base, diasOffset)
    d.setHours(h, m, 0, 0)
    return d
  }

  const pacientesRaw = [
    {
      p: {
        id: 'p1',
        nombre: 'Lucía',
        apellido: 'Gómez',
        email: 'lucia.gomez@gmail.com',
        telefono: '+54 9 341 555-1201',
        fechaNacimiento: '1996-03-14',
        obraSocial: 'OSDE',
        motivoConsulta:
          'Ansiedad y sobrecarga en el trabajo. Le cuesta poner límites y desconectar.',
        estado: 'activo' as const,
        modalidad: 'virtual' as const,
        frecuencia: 'Semanal',
        inicioDias: -120,
      },
      offset: 0,
      hora: [10, 0] as [number, number],
    },
    {
      p: {
        id: 'p2',
        nombre: 'Tomás',
        apellido: 'Rinaldi',
        email: 'tomas.rinaldi@hotmail.com',
        telefono: '+54 9 341 555-3344',
        fechaNacimiento: '1990-07-02',
        obraSocial: 'Particular',
        motivoConsulta: 'Duelo por la muerte de su padre hace cinco meses.',
        estado: 'activo' as const,
        modalidad: 'presencial' as const,
        frecuencia: 'Semanal',
        inicioDias: -70,
      },
      offset: 0,
      hora: [15, 0] as [number, number],
    },
    {
      p: {
        id: 'p3',
        nombre: 'Valentina',
        apellido: 'Sosa',
        email: 'valen.sosa@gmail.com',
        telefono: '+54 9 341 555-8710',
        fechaNacimiento: '2001-11-20',
        obraSocial: 'Swiss Medical',
        motivoConsulta:
          'Ataques de pánico al viajar en colectivo y en lugares con mucha gente.',
        estado: 'activo' as const,
        modalidad: 'virtual' as const,
        frecuencia: 'Semanal',
        inicioDias: -55,
      },
      offset: 0,
      hora: [18, 30] as [number, number],
    },
    {
      p: {
        id: 'p4',
        nombre: 'Joaquín',
        apellido: 'Paz',
        email: 'joaquinpaz@gmail.com',
        telefono: '+54 9 341 555-2290',
        fechaNacimiento: '1985-05-09',
        obraSocial: 'IAPOS',
        motivoConsulta:
          'Conflictos de pareja y dificultad para expresar lo que siente.',
        estado: 'activo' as const,
        modalidad: 'presencial' as const,
        frecuencia: 'Semanal',
        inicioDias: -90,
      },
      offset: 1,
      hora: [9, 0] as [number, number],
    },
    {
      p: {
        id: 'p5',
        nombre: 'Camila',
        apellido: 'Ortiz',
        email: 'cami.ortiz@gmail.com',
        telefono: '+54 9 341 555-6612',
        fechaNacimiento: '1998-01-27',
        obraSocial: 'Particular',
        motivoConsulta: 'Autoestima baja y mucha autoexigencia con la facultad.',
        estado: 'activo' as const,
        modalidad: 'virtual' as const,
        frecuencia: 'Quincenal',
        inicioDias: -100,
      },
      offset: 2,
      hora: [17, 0] as [number, number],
    },
    {
      p: {
        id: 'p6',
        nombre: 'Martín',
        apellido: 'Acosta',
        email: 'martin.acosta@outlook.com',
        telefono: '+54 9 341 555-4021',
        fechaNacimiento: '1979-09-15',
        obraSocial: 'OSDE',
        motivoConsulta: 'Estrés laboral e insomnio de conciliación.',
        estado: 'pausa' as const,
        modalidad: 'presencial' as const,
        frecuencia: 'Semanal',
        inicioDias: -150,
        hasta: -28,
      },
      offset: 3,
      hora: [11, 0] as [number, number],
    },
    {
      p: {
        id: 'p7',
        nombre: 'Sofía',
        apellido: 'Benítez',
        email: 'sofi.benitez@gmail.com',
        telefono: '+54 9 341 555-7735',
        fechaNacimiento: '1993-04-03',
        obraSocial: 'Swiss Medical',
        motivoConsulta: 'Tristeza persistente desde que se mudó de ciudad.',
        estado: 'activo' as const,
        modalidad: 'presencial' as const,
        frecuencia: 'Semanal',
        inicioDias: -40,
      },
      offset: 3,
      hora: [16, 0] as [number, number],
    },
    {
      p: {
        id: 'p8',
        nombre: 'Federico',
        apellido: 'Luna',
        email: 'fede.luna@gmail.com',
        telefono: '+54 9 341 555-9083',
        fechaNacimiento: '1988-12-11',
        obraSocial: 'Particular',
        motivoConsulta: 'Consumo de alcohol en situaciones sociales.',
        estado: 'alta' as const,
        modalidad: 'virtual' as const,
        frecuencia: 'Mensual',
        inicioDias: -200,
        hasta: -45,
      },
      offset: 4,
      hora: [12, 0] as [number, number],
    },
  ]

  const pacientes: Paciente[] = []
  const turnos: Turno[] = []
  const pagos: Pago[] = []
  const notas: NotaClinica[] = []
  let tid = 0
  let pid = 0

  pacientesRaw.forEach((item, pIndex) => {
    const { inicioDias, ...datosPaciente } = item.p
    const pac: Paciente = {
      ...datosPaciente,
      inicio: iso(horaMin(hoy, inicioDias, 9, 0)),
      honorario: 28000,
    }
    pacientes.push(pac)

    const step = pac.frecuencia === 'Semanal' ? 1 : pac.frecuencia === 'Quincenal' ? 2 : 4
    const turnosRealizados: Turno[] = []
    let primerPendiente = false

    for (let k = -8; k <= 2; k++) {
      if ((k % step + step) % step !== 0) continue
      const offsetTotal = item.offset + 7 * k
      if (offsetTotal < inicioDias) continue
      if (item.p.hasta !== undefined && offsetTotal > item.p.hasta) continue

      const inicioT = horaMin(hoy, offsetTotal, item.hora[0], item.hora[1])
      let estado: Turno['estado']
      if (offsetTotal < 0) {
        estado = (k + pIndex) % 9 === 0 ? 'cancelado' : 'realizado'
      } else if (offsetTotal === 0) {
        estado = 'confirmado'
      } else if (!primerPendiente && (pac.id === 'p4' || pac.id === 'p5')) {
        estado = 'pendiente'
        primerPendiente = true
      } else {
        estado = 'confirmado'
      }

      const t: Turno = {
        id: `t${++tid}`,
        pacienteId: pac.id,
        inicio: iso(inicioT),
        duracionMin: 50,
        modalidad: pac.modalidad,
        estado,
        paciente: {
          id: pac.id,
          nombre: pac.nombre,
          apellido: pac.apellido,
        },
      }
      turnos.push(t)
      if (estado === 'realizado') {
        turnosRealizados.push(t)
      }
    }

    const deudaCountMap: Record<string, number> = { p1: 1, p2: 2, p5: 1, p4: 1 }
    const deudaCount = deudaCountMap[pac.id] ?? 0
    const metodos = ['transferencia', 'mercadopago', 'efectivo']

    turnosRealizados.forEach((tReal, idx) => {
      const dTurno = new Date(tReal.inicio)
      const esIapos = pac.obraSocial === 'IAPOS'
      const monto = esIapos ? 9500 : pac.honorario
      const pendiente = idx >= turnosRealizados.length - deudaCount
      pagos.push({
        id: `pg${++pid}`,
        pacienteId: pac.id,
        fecha: tReal.inicio,
        monto,
        estado: pendiente ? 'pendiente' : 'pagado',
        metodo: esIapos ? 'obra social' : metodos[idx % 3],
        concepto: `Sesión ${dTurno.getDate()}/${dTurno.getMonth() + 1}`,
        paciente: {
          id: pac.id,
          nombre: pac.nombre,
          apellido: pac.apellido,
          telefono: pac.telefono,
        },
      })
    })
  })

  // Notas clínicas
  notas.push(
    {
      id: 'np1_1',
      pacienteId: 'p1',
      fecha: iso(horaMin(hoy, -21, 10, 0)),
      texto:
        'Llega cansada, cuenta que respondió mails hasta las 23 h toda la semana. Trabajamos el registro de pensamientos: aparece "si digo que no, me van a ver como floja". Psicoeducación sobre ciclo de ansiedad. Tarea: registro de pensamientos automáticos.',
      etiquetas: ['ansiedad', 'trabajo'],
      resumenIA:
        'Sobrecarga laboral con dificultad para poner límites. Pensamiento central: miedo a ser vista como "floja". Se indicó registro de pensamientos.',
    },
    {
      id: 'np1_2',
      pacienteId: 'p1',
      fecha: iso(horaMin(hoy, -14, 10, 0)),
      texto:
        'Trae el registro completo. Identifica patrón de anticipación catastrófica los domingos a la noche. Practicamos respiración diafragmática en sesión. Acordamos probar decir que no a una tarea extra.',
      etiquetas: ['ansiedad', 'límites'],
    },
    {
      id: 'np1_3',
      pacienteId: 'p1',
      fecha: iso(horaMin(hoy, -7, 10, 0)),
      texto:
        'Pudo rechazar una reunión fuera de horario y "no pasó nada". Lo registra como logro. Baja la ansiedad anticipatoria. Seguimos con reestructuración cognitiva.',
      etiquetas: ['avances', 'límites'],
      resumenIA:
        'Primer límite puesto en el trabajo sin consecuencias negativas. Menor ansiedad anticipatoria. Continúa reestructuración cognitiva.',
    }
  )

  // Ánimos de pacientes
  const animos = [
    [-13, 3],
    [-12, 2, 'Semana de cierre, mucha presión'],
    [-11, 2],
    [-9, 3],
    [-8, 4, 'Salí a caminar'],
    [-7, 3],
    [-6, 2, 'Domingo a la noche, la ansiedad de siempre'],
    [-5, 3],
    [-4, 4],
    [-3, 4, 'Dije que no a una reunión'],
    [-2, 3],
    [-1, 4],
  ].map(([offset, val, nota], i) => ({
    id: `a1_${i}`,
    pacienteId: 'p1',
    fecha: iso(horaMin(hoy, offset as number, 21, 0)),
    valor: val as number,
    nota: nota as string | undefined,
  }))

  // Tareas
  const tareas = [
    {
      id: 'tk1',
      pacienteId: 'p1',
      titulo: 'Registro de pensamientos automáticos',
      detalle: 'Cuando aparezca la ansiedad, anotá la situación, lo que pensaste y qué sentiste.',
      hecha: false,
    },
    {
      id: 'tk2',
      pacienteId: 'p1',
      titulo: 'Respiración diafragmática 5 minutos por día',
      hecha: false,
    },
    {
      id: 'tk3',
      pacienteId: 'p1',
      titulo: 'Decir que no a una tarea extra',
      hecha: true,
    },
  ]

  // Solicitudes entrantes
  const solicitudes: Solicitud[] = [
    {
      id: 's1',
      profesionalId: 'pro1',
      fecha: iso(new Date(ahora.getTime() - 3 * 3600 * 1000)),
      estado: 'nueva',
      afinidad: 94,
      contacto: {
        nombre: 'Rocío',
        email: 'rocio.mansilla@gmail.com',
        edad: 27,
      },
      resumen: {
        motivo:
          'Empecé un trabajo nuevo y vivo con el pecho apretado. Me cuesta muchísimo dormir.',
        temas: ['ansiedad', 'sueño', 'trabajo y estudio'],
        desde: 'Hace algunas semanas',
        impacto:
          'Me despierto a las 4 y no me puedo volver a dormir. Llego a la oficina agotada y con miedo de equivocarme.',
        cambioEsperado:
          'Poder dormir de corrido y llegar al trabajo sin ese nudo en el estómago.',
        preferencias: {
          modalidad: 'virtual',
          cobertura: 'OSDE',
          genero: 'Indistinto',
        },
        riesgo: 'bajo',
        texto:
          'Consulta porque empezó un trabajo nuevo y, en sus palabras, "vive con el pecho apretado". Lo viene sintiendo hace algunas semanas. Cuenta que se despierta a las 4 de la mañana y no puede volver a dormirse, y que llega a la oficina agotada y con miedo de equivocarse. Le gustaría poder dormir de corrido y llegar al trabajo "sin ese nudo en el estómago".',
      },
    },
    {
      id: 's2',
      profesionalId: 'pro1',
      fecha: iso(new Date(ahora.getTime() - 26 * 3600 * 1000)),
      estado: 'nueva',
      afinidad: 88,
      contacto: {
        nombre: 'Nico',
        email: 'nico.vera99@gmail.com',
        edad: 24,
      },
      resumen: {
        motivo:
          'Tengo miedo de viajar solo desde que tuve dos episodios fuertes en el colectivo: me faltaba el aire y pensé que me moría.',
        temas: ['ataques de pánico', 'ansiedad'],
        desde: 'Hace meses',
        impacto:
          'Dejé de ir a la facu en colectivo y dependo de que alguien me lleve. Me da vergüenza pedirlo.',
        cambioEsperado: 'Volver a moverme solo por la ciudad.',
        preferencias: {
          modalidad: 'presencial',
          cobertura: 'Particular',
          genero: 'Indistinto',
        },
        riesgo: 'bajo',
        texto:
          'Consulta porque tiene miedo de viajar solo desde que tuvo "dos episodios fuertes en el colectivo", en los que le faltaba el aire y pensó que se moría. Lo siente hace meses. Dejó de ir a la facultad en colectivo y depende de que alguien lo lleve, algo que le da vergüenza pedir. Le gustaría volver a moverse solo por la ciudad.',
      },
    },
  ]

  return {
    version: DEMO_VERSION,
    profesional: PROFESIONALES_MOCK[0],
    pacienteActualId: 'p1',
    pacientes,
    turnos,
    notas,
    pagos,
    animos,
    tareas,
    profesionales: PROFESIONALES_MOCK,
    solicitudes,
  }
}

let proCache: EstadoDemoProfesional | null = null

export function getDemoProfesional(): EstadoDemoProfesional {
  if (proCache) return proCache
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PRO)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.version === DEMO_VERSION) {
          proCache = parsed
          return proCache!
        }
      }
    } catch {}
  }
  proCache = generarDatosIniciales()
  guardarDemoProfesional(proCache)
  return proCache
}

export function guardarDemoProfesional(estado: EstadoDemoProfesional) {
  proCache = estado
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_PRO, JSON.stringify(estado))
      window.dispatchEvent(new Event('puente-pro-storage'))
    } catch {}
  }
}

export function resetDemoProfesional() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_PRO)
  }
  proCache = generarDatosIniciales()
  guardarDemoProfesional(proCache)
}

export function useDemoProfesional(): EstadoDemoProfesional {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === 'undefined') return () => {}
      window.addEventListener('puente-pro-storage', cb)
      return () => window.removeEventListener('puente-pro-storage', cb)
    },
    getDemoProfesional,
    () => generarDatosIniciales()
  )
}

export function responderAsistentePro(
  estado: EstadoDemoProfesional,
  mensajes: { role: string; content: string }[]
): string {
  const last = (mensajes[mensajes.length - 1]?.content || '').toLowerCase()
  const hoy = new Date()

  if (/hoy|agenda|turnos/.test(last)) {
    const tHoy = estado.turnos
      .filter((t) => mismoDia(t.inicio, hoy) && t.estado !== 'cancelado')
      .sort((a, b) => a.inicio.localeCompare(b.inicio))
    if (!tHoy.length) {
      return 'Hoy no tenés turnos agendados. Buen momento para ponerte al día con notas o cobros.'
    }
    return `Hoy tenés ${tHoy.length} ${tHoy.length === 1 ? 'turno' : 'turnos'}:\n\n` +
      tHoy
        .map(
          (t) =>
            `- **${formatHora(t.inicio)}** · ${nombreCompleto(t.paciente)} (${t.modalidad}${
              t.estado === 'pendiente' ? ', sin confirmar' : ''
            })`
        )
        .join('\n')
  }

  if (/deb|deuda|cobr|pag/.test(last)) {
    const deudas = new Map<string, number>()
    estado.pagos
      .filter((p) => p.estado === 'pendiente')
      .forEach((p) => {
        deudas.set(p.pacienteId, (deudas.get(p.pacienteId) ?? 0) + p.monto)
      })
    if (!deudas.size) {
      return 'No hay cobros pendientes. ¡Todo al día!'
    }
    const lista = [...deudas.entries()]
      .map(([pid, monto]) => {
        const pac = estado.pacientes.find((p) => p.id === pid)
        return `- **${pac ? nombreCompleto(pac) : pid}**: ${formatPesos(monto)}`
      })
      .join('\n')
    return (
      `Estos pacientes tienen saldo pendiente:\n\n${lista}\n\n` +
      'Podés enviarles un recordatorio por WhatsApp desde **Cobros**.'
    )
  }

  const pac = estado.pacientes.find(
    (p) =>
      last.includes(p.nombre.toLowerCase()) ||
      last.includes(p.apellido.toLowerCase())
  )

  if (pac) {
    const notasPac = estado.notas
      .filter((n) => n.pacienteId === pac.id)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
    const sesCount = estado.turnos.filter(
      (t) => t.pacienteId === pac.id && t.estado === 'realizado'
    ).length
    const ultNota = notasPac[0]
      ? `**Última nota (${formatFechaCorta(notasPac[0].fecha)}):** ${
          notasPac[0].resumenIA ?? notasPac[0].texto
        }`
      : ''
    return [
      `**${nombreCompleto(pac)}** · ${sesCount} sesiones realizadas.`,
      `**Motivo de consulta:** ${pac.motivoConsulta}`,
      ultNota,
      'Para la próxima sesión podrías retomar lo trabajado en la última nota y revisar cómo le fue con las tareas pendientes.',
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  if (/t[eé]cnica|ansiedad|p[aá]nico|herramient|intervenci/.test(last)) {
    return [
      'Algunas técnicas con buena evidencia para ansiedad:',
      '',
      '- **Psicoeducación** sobre el ciclo de la ansiedad y la función de los síntomas físicos.',
      '- **Respiración diafragmática** y relajación muscular progresiva como herramientas de regulación.',
      '- **Registro de pensamientos** y reestructuración cognitiva para trabajar la anticipación catastrófica.',
      '- **Exposición gradual** con jerarquía consensuada, sobre todo en pánico y evitación.',
      '- **Activación conductual** cuando hay retraimiento o ánimo bajo asociado.',
      '',
      'Son sugerencias generales: tu criterio clínico es el que decide qué encaja con cada paciente.',
    ].join('\n')
  }

  if (/solicitud|nuev/.test(last)) {
    const nuevas = estado.solicitudes.filter(
      (s) => s.estado === 'nueva' && s.profesionalId === estado.profesional.id
    )
    if (!nuevas.length) return 'No tenés solicitudes nuevas por ahora.'
    return (
      `Tenés ${nuevas.length} solicitudes nuevas:\n\n` +
      nuevas
        .map(
          (s) =>
            `- **${s.contacto.nombre}** (${s.afinidad}% de afinidad): ${s.resumen.temas.join(
              ', '
            )}`
        )
        .join('\n')
    )
  }

  return 'Puedo ayudarte a preparar sesiones, revisar tu agenda o tus cobros. Probá con algo como "¿Qué tengo hoy?", "Resumime a Lucía antes de la sesión" o "¿Quién me debe?".'
}
