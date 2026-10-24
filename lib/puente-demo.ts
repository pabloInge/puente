'use client'

import { useSyncExternalStore } from 'react'

export interface Profesional {
  id: string
  nombre: string
  apellido: string
  genero: 'mujer' | 'varón'
  matricula: string
  anios: number
  enfoques: string[]
  temas: string[]
  modalidades: ('virtual' | 'presencial')[]
  obrasSociales: string[]
  honorario: number
  frase: string
  bio: string
  disponible: string
  foto: string
  emiteFactura: boolean
  duracionMin: number
  formacion: string[]
  idiomas: string[]
  cancelacion: string
}

export interface Paciente {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  fechaNacimiento: string
  obraSocial: string
  motivoConsulta: string
  estado: 'activo' | 'pausa' | 'alta'
  modalidad: 'virtual' | 'presencial'
  frecuencia: string
  inicio: string
  honorario: number
  resumenInicial?: ResumenIntake
  edad?: number
  proximoTurno?: Turno
  ultimaSesion?: string
  sesiones?: number
  deuda?: number
}

export interface Turno {
  id: string
  pacienteId: string
  inicio: string
  duracionMin: number
  modalidad: 'virtual' | 'presencial'
  estado: 'confirmado' | 'pendiente' | 'realizado' | 'cancelado'
  paciente: {
    id: string
    nombre: string
    apellido: string
  }
}

export interface Pago {
  id: string
  pacienteId: string
  fecha: string
  monto: number
  estado: 'pendiente' | 'pagado'
  metodo: string
  concepto: string
  paciente?: {
    id: string
    nombre: string
    apellido: string
    telefono: string
  }
}

export interface NotaClinica {
  id: string
  pacienteId: string
  fecha: string
  texto: string
  etiquetas: string[]
  resumenIA?: string
}

export interface EntradaDiario {
  id: string
  fecha: string
  texto: string
  animo: number
  etiquetas: string[]
  compartida: boolean
  paraSesion: boolean
}

export interface Objetivo {
  id: string
  texto: string
  origen: 'primera charla' | 'con tu profesional'
  progreso: number[]
}

export interface Ejercicio {
  id: string
  titulo: string
  detalle: string
  quePaso?: string
  fecha?: string
}

export interface ResumenIntake {
  motivo: string
  temas: string[]
  desde: string
  impacto: string
  cambioEsperado: string
  preferencias: {
    modalidad: 'virtual' | 'presencial' | 'indistinto'
    cobertura: string
    genero: 'mujer' | 'varón' | 'Indistinto'
  }
  riesgo: 'bajo' | 'alto'
  texto: string
}

export interface Solicitud {
  id: string
  profesionalId: string
  fecha: string
  estado: 'nueva' | 'aceptada' | 'derivada'
  afinidad: number
  contacto: {
    nombre: string
    email?: string
    telefono?: string
    edad?: number
  }
  resumen: ResumenIntake
  conInforme?: boolean
  pacienteId?: string
  motivoDerivacion?: string
}

export interface EstadoChatIntake {
  paso: number
  temas: string[]
  motivo: string
  desde: string
  impacto: string
  cambio: string
  modalidad: 'virtual' | 'presencial' | 'indistinto'
  cobertura: string
  genero: 'mujer' | 'varón' | 'Indistinto'
  riesgo: 'bajo' | 'alto'
  enPausa: boolean
}

export interface MensajeChat {
  role: 'assistant' | 'user'
  content: string
  opciones?: string[]
  alerta?: boolean
}

export interface SesionPaciente {
  id: string
  creada: string
  etapa: 'chat' | 'cards' | 'enviado'
  chat: {
    mensajes: MensajeChat[]
    estado: EstadoChatIntake
    resumen: ResumenIntake | null
  }
  vistos: string[]
  elegidos: string[]
  contacto: {
    nombre: string
    via: 'whatsapp' | 'email'
    valor: string
  } | null
  conInforme: boolean
  panel: {
    profesionalId: string
    sesiones: {
      id: string
      fecha: string
      modalidad: 'virtual' | 'presencial'
      meLlevo?: string
    }[]
    entradas: EntradaDiario[]
    objetivos: Objetivo[]
    ejercicios: Ejercicio[]
    semanaCompartida: {
      texto: string
      fecha: string
    } | null
    derivacion: {
      estado: 'ninguna' | 'pedida' | 'aprobada'
      pedidaEn?: string
      texto?: string
    }
  } | null
}

export function formatPesos(n: number): string {
  return `$ ${Math.round(n).toLocaleString('es-AR')}`
}

export function capitalize(s: string): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatHora(iso: string | Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export function formatFechaCorta(
  iso: string | Date,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
): string {
  return new Intl.DateTimeFormat('es-AR', options)
    .format(new Date(iso))
    .replace('.', '')
}

export function formatFechaLarga(iso: string | Date): string {
  return capitalize(
    new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(iso))
  )
}

export function formatDiaSemana(iso: string | Date): string {
  return capitalize(
    new Intl.DateTimeFormat('es-AR', { weekday: 'short' })
      .format(new Date(iso))
      .replace('.', '')
  )
}

export function formatFechaHora(iso: string | Date): string {
  return `${formatFechaLarga(iso)} · ${formatHora(iso)} h`
}

export function formatTiempoRelativo(iso: string | Date): string {
  const diffSec = (new Date(iso).getTime() - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' })
  const absSec = Math.abs(diffSec)
  if (absSec < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (absSec < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  return rtf.format(Math.round(diffSec / 86400), 'day')
}

export function calcularEdad(fechaNacimiento: string): number {
  const birth = new Date(fechaNacimiento)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function mismoDia(d1: string | Date, d2: string | Date): boolean {
  const a = new Date(d1)
  const b = new Date(d2)
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function inicioDelDia(d: string | Date): Date {
  const res = new Date(d)
  res.setHours(0, 0, 0, 0)
  return res
}

export function inicioDeSemana(d: string | Date): Date {
  const res = inicioDelDia(d)
  const day = (res.getDay() + 6) % 7
  res.setDate(res.getDate() - day)
  return res
}

export function sumarDias(d: string | Date, days: number): Date {
  const res = new Date(d)
  res.setDate(res.getDate() + days)
  return res
}

export function toIsoDate(d: string | Date): string {
  const date = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function saludoSegunHora(d = new Date()): string {
  const h = d.getHours()
  if (h < 13) return 'Buen día'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export function nombreCompleto(persona: { nombre: string; apellido?: string }): string {
  return `${persona.nombre} ${persona.apellido ?? ''}`.trim()
}

export function iniciales(persona: { nombre: string; apellido?: string }): string {
  return `${persona.nombre.charAt(0)}${persona.apellido?.charAt(0) ?? ''}`.toUpperCase()
}

export const CANCELACION_ESTANDAR =
  'Podés cancelar o mover el turno sin costo hasta 24 hs antes.'

export const PROFESIONALES_MOCK: Profesional[] = [
  {
    id: 'pro1',
    nombre: 'Martina',
    apellido: 'Ferreyra',
    genero: 'mujer',
    matricula: 'MP 4512',
    anios: 9,
    enfoques: ['TCC', 'Mindfulness'],
    temas: ['ansiedad', 'ataques de pánico', 'sueño', 'trabajo y estudio', 'autoestima'],
    modalidades: ['virtual', 'presencial'],
    obrasSociales: ['Particular', 'OSDE', 'Swiss Medical'],
    honorario: 28000,
    frase: 'Trabajo con herramientas concretas para que notes cambios en tu día a día.',
    bio: 'Psicóloga (UNR). Trabajo con terapia cognitivo-conductual: herramientas concretas para entender lo que sentís y animarte a hacer cambios a tu ritmo.',
    disponible: 'Turnos esta semana',
    foto: '/assets/pros/pro1.webp',
    emiteFactura: true,
    duracionMin: 50,
    formacion: [
      'Lic. en Psicología, UNR',
      'Posgrado en Terapia Cognitivo-Conductual, Fundación Aiglé',
      'Formación en Mindfulness',
    ],
    idiomas: ['Español', 'Inglés'],
    cancelacion: CANCELACION_ESTANDAR,
  },
  {
    id: 'pro2',
    nombre: 'Julián',
    apellido: 'Bertolini',
    genero: 'varón',
    matricula: 'MP 3920',
    anios: 14,
    enfoques: ['Psicoanálisis'],
    temas: ['vínculos y pareja', 'duelo', 'tristeza / ánimo bajo', 'familia'],
    modalidades: ['presencial'],
    obrasSociales: ['Particular', 'OSDE', 'IAPOS'],
    honorario: 25000,
    frase: 'Hablar es la forma de empezar a entender lo que nos pasa.',
    bio: 'Psicoanalista. Atiendo adultos en consultorio en barrio Martin. Me interesa escuchar tu historia sin apuro.',
    disponible: 'Turnos la semana próxima',
    foto: '/assets/pros/pro2.webp',
    emiteFactura: true,
    duracionMin: 45,
    formacion: [
      'Lic. en Psicología, UNR',
      'Formación en Psicoanálisis, Escuela de Orientación Lacaniana',
    ],
    idiomas: ['Español'],
    cancelacion: 'Podés cancelar sin costo hasta 48 hs antes.',
  },
  {
    id: 'pro3',
    nombre: 'Carolina',
    apellido: 'Méndez',
    genero: 'mujer',
    matricula: 'MP 5108',
    anios: 6,
    enfoques: ['Sistémica'],
    temas: ['familia', 'vínculos y pareja', 'identidad y diversidad', 'ansiedad'],
    modalidades: ['virtual', 'presencial'],
    obrasSociales: ['Particular', 'Galeno'],
    honorario: 22000,
    frase: 'No estamos solos: miramos también los vínculos que nos rodean.',
    bio: 'Terapeuta sistémica. Acompaño procesos individuales, de pareja y familia, con perspectiva de género y diversidad.',
    disponible: 'Turnos esta semana',
    foto: '/assets/pros/pro3.webp',
    emiteFactura: false,
    duracionMin: 50,
    formacion: [
      'Lic. en Psicología, UCEL',
      'Especialización en Terapia Sistémica de Pareja y Familia',
    ],
    idiomas: ['Español', 'Portugués'],
    cancelacion: CANCELACION_ESTANDAR,
  },
  {
    id: 'pro4',
    nombre: 'Lautaro',
    apellido: 'Quiroga',
    genero: 'varón',
    matricula: 'MP 5321',
    anios: 7,
    enfoques: ['ACT', 'TCC'],
    temas: ['ansiedad', 'consumos', 'trabajo y estudio', 'sueño'],
    modalidades: ['virtual'],
    obrasSociales: ['Particular', 'Swiss Medical', 'OSDE'],
    honorario: 24000,
    frase: 'No se trata de pelearte con lo que sentís, sino de vivir según lo que te importa.',
    bio: 'Trabajo con terapia de aceptación y compromiso. Atiendo jóvenes y adultos, solo online.',
    disponible: 'Turnos esta semana',
    foto: '/assets/pros/pro4.webp',
    emiteFactura: true,
    duracionMin: 50,
    formacion: [
      'Lic. en Psicología, UNR',
      'Formación en Terapia de Aceptación y Compromiso (ACT)',
    ],
    idiomas: ['Español', 'Inglés'],
    cancelacion: CANCELACION_ESTANDAR,
  },
  {
    id: 'pro5',
    nombre: 'Agustina',
    apellido: 'Peralta',
    genero: 'mujer',
    matricula: 'MP 4087',
    anios: 11,
    enfoques: ['EMDR', 'TCC'],
    temas: ['experiencias traumáticas', 'ataques de pánico', 'duelo', 'ansiedad'],
    modalidades: ['presencial'],
    obrasSociales: ['Particular', 'OSDE', 'Galeno'],
    honorario: 32000,
    frase: 'El cuerpo también recuerda; podemos ayudarlo a soltar.',
    bio: 'Especializada en trauma y pánico. Formación en EMDR. Consultorio en zona Centro.',
    disponible: 'Turnos en 2 semanas',
    foto: '/assets/pros/pro5.webp',
    emiteFactura: true,
    duracionMin: 60,
    formacion: [
      'Lic. en Psicología, UNR',
      'Terapeuta EMDR certificada, EMDR Iberoamérica',
      'Posgrado en Trauma',
    ],
    idiomas: ['Español'],
    cancelacion: 'Podés cancelar sin costo hasta 48 hs antes.',
  },
  {
    id: 'pro6',
    nombre: 'Ramiro',
    apellido: 'Ledesma',
    genero: 'varón',
    matricula: 'MP 5602',
    anios: 5,
    enfoques: ['Gestalt'],
    temas: ['autoestima', 'identidad y diversidad', 'tristeza / ánimo bajo', 'vínculos y pareja'],
    modalidades: ['virtual', 'presencial'],
    obrasSociales: ['Particular', 'IAPOS'],
    honorario: 20000,
    frase: 'Darte cuenta de lo que sentís ya es empezar a cambiar.',
    bio: 'Psicólogo gestáltico. Espacio cálido y sin juicios, con mucha experiencia en población LGBTIQ+.',
    disponible: 'Turnos esta semana',
    foto: '/assets/pros/pro6.webp',
    emiteFactura: false,
    duracionMin: 50,
    formacion: [
      'Lic. en Psicología, UNR',
      'Formación en Terapia Gestalt, Asociación Gestáltica de Rosario',
    ],
    idiomas: ['Español', 'Italiano'],
    cancelacion: CANCELACION_ESTANDAR,
  },
  {
    id: 'pro7',
    nombre: 'Florencia',
    apellido: 'Ibarra',
    genero: 'mujer',
    matricula: 'MP 4830',
    anios: 8,
    enfoques: ['TCC', 'Mindfulness'],
    temas: ['sueño', 'ansiedad', 'consumos', 'autoestima'],
    modalidades: ['virtual', 'presencial'],
    obrasSociales: ['Particular', 'IAPOS', 'Swiss Medical'],
    honorario: 26000,
    frase: 'Pequeños cambios sostenidos hacen una gran diferencia.',
    bio: 'Psicóloga clínica, formada en terapia cognitiva del insomnio. Trabajo con objetivos claros y revisables.',
    disponible: 'Turnos la semana próxima',
    foto: '/assets/pros/pro7.webp',
    emiteFactura: true,
    duracionMin: 50,
    formacion: [
      'Lic. en Psicología, UCEL',
      'Posgrado en Terapia Cognitivo-Conductual',
      'Curso de Mindfulness para la ansiedad',
    ],
    idiomas: ['Español', 'Inglés'],
    cancelacion: CANCELACION_ESTANDAR,
  },
]

// Diccionario de temas detectables en lenguaje natural
export const TEMAS_DICT: Record<string, RegExp> = {
  ansiedad: /ansi|nervios|angusti|preocup|pecho|nudo|estr[eé]s|acelerad/i,
  'ataques de pánico': /p[aá]nico|falta(ba)? el aire|ataque|me mor[ií]a|me muero|ahog/i,
  'tristeza / ánimo bajo': /trist|baj[oó]n|sin ganas|llor|vac[ií]o|deprim|desgano/i,
  duelo: /muri[oó]|falleci|p[eé]rdida|duelo|extra[nñ]o a/i,
  'vínculos y pareja': /pareja|novi[oa]|separ|relaci[oó]n|v[ií]nculo|ex\b/i,
  familia: /familia|mam[aá]|pap[aá]|padre|madre|herman|hij[oa]s?/i,
  'trabajo y estudio': /trabaj|laburo|jefe|jefa|facu|estudi|examen|oficina|parcial/i,
  sueño: /dormir|duermo|insomnio|sue[nñ]o|me despierto|desvel/i,
  autoestima: /autoestima|no sirvo|insegur|me comparo|exigen|in[uú]til|no soy suficiente/i,
  consumos: /alcohol|tomo mucho|consumo|droga|porro|apuesta|apostar/i,
  'experiencias traumáticas': /abus|accidente|violencia|trauma|asalt|me robaron/i,
  'identidad y diversidad': /identidad|gay|lesbiana|trans\b|orientaci[oó]n|bisexual|no binari/i,
}

export const REGEX_RIESGO =
  /no quiero (seguir )?vivir|matarme|suicid|hacerme da[nñ]o|lastimarme|terminar con todo|quitarme la vida|desaparecer para siempre|no vale la pena vivir/i

export const MENSAJE_INICIAL =
  'Hola. Contame qué te está pasando, sin apuro. No hago diagnósticos: te ayudo a ordenarlo y a encontrar con quién hablar. ¿Qué te trae por acá?'

export const ESTADO_INICIAL_CHAT: EstadoChatIntake = {
  paso: 0,
  temas: [],
  motivo: '',
  desde: '',
  impacto: '',
  cambio: '',
  modalidad: 'indistinto',
  cobertura: 'Particular',
  genero: 'Indistinto',
  riesgo: 'bajo',
  enPausa: false,
}

export function detectarTemas(text: string): string[] {
  return Object.entries(TEMAS_DICT)
    .filter(([, regex]) => regex.test(text))
    .map(([tema]) => tema)
}

export function formatearLista(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

export function getPreguntaPaso(paso: number): {
  respuesta: string
  opciones?: string[]
} {
  switch (paso) {
    case 1:
      return {
        respuesta: '¿Desde cuándo lo venís sintiendo?',
        opciones: ['Hace unos días', 'Algunas semanas', 'Hace meses', 'Hace años'],
      }
    case 2:
      return {
        respuesta:
          '¿Y cómo está afectando tu día a día? Por ejemplo en el trabajo o el estudio, el descanso, tus vínculos…',
      }
    case 3:
      return {
        respuesta:
          'Si este proceso te ayudara, ¿qué empezarías a notar de diferente en tu vida?',
      }
    case 4:
      return {
        respuesta: '¿Preferís atenderte de forma virtual o presencial?',
        opciones: ['Virtual', 'Presencial en Rosario', 'Me da igual'],
      }
    case 5:
      return {
        respuesta:
          '¿Tenés obra social o prepaga, o sería particular?',
        opciones: ['Particular', 'OSDE', 'Swiss Medical', 'IAPOS', 'Galeno', 'Otra'],
      }
    case 6:
      return {
        respuesta: '¿Tenés alguna preferencia sobre el profesional?',
        opciones: ['Me da igual', 'Mujer', 'Varón'],
      }
    default:
      return { respuesta: '' }
  }
}

const CONECTORES_PASO: Record<number, string> = {
  2: 'Entiendo. ',
  3: 'Gracias por ponerlo en palabras, no siempre es fácil. ',
  4: 'Qué bueno tener eso en claro. Ahora unas preguntas más prácticas para encontrar a quien pueda acompañarte. ',
  5: '',
  6: 'Última pregunta. ',
}

export function avanzarEstadoChat(
  estado: EstadoChatIntake,
  input: string
): EstadoChatIntake {
  const next = { ...estado }
  switch (estado.paso) {
    case 0:
      next.motivo = input
      next.temas = Array.from(new Set([...next.temas, ...detectarTemas(input)]))
      break
    case 1:
      next.desde = input
      break
    case 2:
      next.impacto = input
      next.temas = Array.from(new Set([...next.temas, ...detectarTemas(input)]))
      break
    case 3:
      next.cambio = input
      break
    case 4:
      next.modalidad = /virtual|online/i.test(input)
        ? 'virtual'
        : /presencial/i.test(input)
        ? 'presencial'
        : 'indistinto'
      break
    case 5:
      next.cobertura = input.trim() || 'Particular'
      break
    case 6:
      next.genero = /mujer/i.test(input)
        ? 'mujer'
        : /var[oó]n|hombre/i.test(input)
        ? 'varón'
        : 'Indistinto'
      break
  }
  next.paso = estado.paso + 1
  return next
}

function limpiarTexto(s: string) {
  const t = s.trim().replace(/[.\s]+$/, '')
  return t.charAt(0).toLowerCase() + t.slice(1)
}

export function armarResumenIntake(estado: EstadoChatIntake): ResumenIntake {
  const temas = estado.temas.length ? estado.temas : ['ansiedad']
  const texto = [
    `Consulta porque, en sus palabras, "${limpiarTexto(estado.motivo)}".`,
    estado.desde ? `Lo viene sintiendo ${limpiarTexto(estado.desde)}.` : '',
    estado.impacto
      ? `En el día a día le afecta así: "${limpiarTexto(estado.impacto)}".`
      : '',
    estado.cambio
      ? `Le gustaría empezar a notar: "${limpiarTexto(estado.cambio)}".`
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  return {
    motivo: estado.motivo,
    temas,
    desde: estado.desde,
    impacto: estado.impacto,
    cambioEsperado: estado.cambio,
    preferencias: {
      modalidad: estado.modalidad,
      cobertura: estado.cobertura,
      genero: estado.genero,
    },
    riesgo: estado.riesgo,
    texto,
  }
}

export function procesarMensajeChat(
  mensajes: MensajeChat[],
  estado: EstadoChatIntake
): {
  respuesta: string
  opciones?: string[]
  alerta?: boolean
  fin?: boolean
  resumen?: ResumenIntake
  estado: EstadoChatIntake
} {
  const ultimo = mensajes[mensajes.length - 1]?.content ?? ''

  if (estado.enPausa) {
    if (/^quiero seguir/i.test(ultimo.trim())) {
      const p = getPreguntaPaso(estado.paso)
      return {
        respuesta: `Gracias por quedarte. Seguimos a tu ritmo. ${p.respuesta}`,
        opciones: p.opciones,
        estado: { ...estado, enPausa: false },
      }
    }
    if (/^ahora no/i.test(ultimo.trim())) {
      return {
        respuesta:
          'Está bien, no hay apuro. Los teléfonos de ayuda siguen acá arriba por si los necesitás. Cuando quieras, escribime y seguimos.',
        opciones: ['Quiero seguir'],
        estado,
      }
    }
  }

  const tieneRiesgo = REGEX_RIESGO.test(ultimo)
  const nuevoEstado = avanzarEstadoChat({ ...estado, enPausa: false }, ultimo)

  if (tieneRiesgo) {
    return {
      respuesta:
        'Gracias por confiarme algo así. Lo que contás me preocupa y quiero que tengas ayuda ahora, no solo un turno. No tenés que atravesarlo en soledad: estas líneas atienden las 24 horas y te pueden acompañar en este momento.',
      alerta: true,
      opciones: ['Quiero seguir', 'Ahora no'],
      estado: { ...nuevoEstado, riesgo: 'alto', enPausa: true },
    }
  }

  if (nuevoEstado.paso === 1) {
    const preg = getPreguntaPaso(1)
    return {
      respuesta:
        'Gracias por contármelo. Tiene sentido que quieras hablarlo con alguien. ' +
        preg.respuesta,
      opciones: preg.opciones,
      estado: nuevoEstado,
    }
  }

  if (nuevoEstado.paso >= 7) {
    return {
      respuesta:
        'Gracias por contarme todo esto. Ya tengo lo necesario para presentarte algunos profesionales.',
      fin: true,
      resumen: armarResumenIntake(nuevoEstado),
      estado: nuevoEstado,
    }
  }

  const p = getPreguntaPaso(nuevoEstado.paso)
  return {
    respuesta: (CONECTORES_PASO[nuevoEstado.paso] ?? '') + p.respuesta,
    opciones: p.opciones,
    estado: nuevoEstado,
  }
}

export function rankearProfesionales(
  pros: Profesional[],
  resumen: ResumenIntake
): {
  profesional: Profesional
  afinidad: number
  motivos: string[]
}[] {
  return pros
    .map((p) => {
      const matchTemas = resumen.temas.filter((t) => p.temas.includes(t))
      const matchMod =
        resumen.preferencias.modalidad === 'indistinto' ||
        p.modalidades.includes(resumen.preferencias.modalidad)
      const matchCob = p.obrasSociales.some(
        (o) => o.toLowerCase() === resumen.preferencias.cobertura.toLowerCase()
      )
      const matchGen =
        resumen.preferencias.genero === 'Indistinto' ||
        p.genero === resumen.preferencias.genero

      let score =
        52 +
        matchTemas.length * 12 +
        (matchMod ? 8 : -10) +
        (matchCob ? 8 : 0) +
        (matchGen ? 4 : -12)

      if (p.disponible.includes('esta semana')) score += 3
      score = Math.max(48, Math.min(98, score))

      const motivos: string[] = []
      if (matchTemas.length)
        motivos.push(`Trabaja con ${formatearLista(matchTemas.slice(0, 2))}`)
      if (matchMod && resumen.preferencias.modalidad !== 'indistinto') {
        motivos.push(
          resumen.preferencias.modalidad === 'virtual'
            ? 'Atiende online'
            : 'Atiende presencial en Rosario'
        )
      }
      if (matchCob && resumen.preferencias.cobertura !== 'Particular') {
        motivos.push(`Acepta ${resumen.preferencias.cobertura}`)
      }
      if (p.disponible.includes('esta semana')) {
        motivos.push('Tiene turnos esta semana')
      }
      if (motivos.length < 2) {
        motivos.push(`${p.anios} años de experiencia`)
      }

      return {
        profesional: p,
        afinidad: score,
        motivos: motivos.slice(0, 3),
      }
    })
    .sort((a, b) => b.afinidad - a.afinidad)
}

// Storage helpers
const STORAGE_KEY_SESION = 'puente-sesion-v1'
const EVENT_SESION = 'puente-sesion'

let sesionCache: SesionPaciente | null | undefined = undefined

export function getSesionGuardada(): SesionPaciente | null {
  if (typeof window === 'undefined') return null
  if (sesionCache !== undefined) return sesionCache
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESION)
    sesionCache = raw ? JSON.parse(raw) : null
  } catch {
    sesionCache = null
  }
  return sesionCache ?? null
}

export function guardarSesion(sesion: SesionPaciente | null) {
  sesionCache = sesion
  if (typeof window === 'undefined') return
  if (sesion) {
    localStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(sesion))
  } else {
    localStorage.removeItem(STORAGE_KEY_SESION)
  }
  window.dispatchEvent(new Event(EVENT_SESION))
}

export function updateSesion(
  fn: (prev: SesionPaciente) => SesionPaciente
) {
  const current = getSesionGuardada()
  if (current) {
    guardarSesion(fn(current))
  }
}

export function updatePanel(
  fn: (prev: NonNullable<SesionPaciente['panel']>) => NonNullable<SesionPaciente['panel']>
) {
  updateSesion((s) => (s.panel ? { ...s, panel: fn(s.panel) } : s))
}

export function subscribeSesion(cb: () => void) {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_SESION) {
      sesionCache = undefined
      cb()
    }
  }
  window.addEventListener(EVENT_SESION, cb)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT_SESION, cb)
    window.removeEventListener('storage', onStorage)
  }
}

export function useSesionPaciente(): SesionPaciente | null {
  return useSyncExternalStore(
    subscribeSesion,
    getSesionGuardada,
    () => null
  )
}

export function crearSesionInicial(): SesionPaciente {
  return {
    id: Math.random().toString(36).slice(2, 10),
    creada: new Date().toISOString(),
    etapa: 'chat',
    chat: {
      mensajes: [{ role: 'assistant', content: MENSAJE_INICIAL }],
      estado: ESTADO_INICIAL_CHAT,
      resumen: null,
    },
    vistos: [],
    elegidos: [],
    contacto: null,
    conInforme: false,
    panel: null,
  }
}

export function activarDemoPaciente(sesion: SesionPaciente): SesionPaciente {
  const res = sesion.chat.resumen ?? {
    motivo:
      'Desde que cambié de trabajo no duermo bien y siento el pecho apretado todo el día.',
    temas: ['ansiedad', 'estrés laboral', 'sueño'],
    desde: 'Hace meses',
    impacto: 'Me cuesta concentrarme y llego cansada a todo.',
    cambioEsperado:
      'Poder dormir tranquila y no sentir que el trabajo me come la cabeza.',
    preferencias: {
      modalidad: 'virtual',
      cobertura: 'OSDE',
      genero: 'Indistinto',
    },
    riesgo: 'bajo',
    texto:
      'Desde que cambié de trabajo no duermo bien y siento el pecho apretado todo el día. Lo vengo sintiendo hace meses y me cuesta concentrarme. Me gustaría poder dormir tranquila y no sentir que el trabajo me come la cabeza.',
  }

  const baseDate = (offsetDays: number, hour = 12) => {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    d.setHours(hour, 0, 0, 0)
    return d.toISOString()
  }

  const proId = sesion.elegidos[0] ?? 'pro1'

  return {
    ...sesion,
    chat: { ...sesion.chat, resumen: res },
    panel: {
      profesionalId: proId,
      sesiones: [
        {
          id: Math.random().toString(36).slice(2, 9),
          fecha: baseDate(-6, 18),
          modalidad: 'virtual',
          meLlevo: 'Que no tengo que resolver todo esta noche.',
        },
        {
          id: Math.random().toString(36).slice(2, 9),
          fecha: baseDate(0, 9),
          modalidad: 'virtual',
        },
        {
          id: Math.random().toString(36).slice(2, 9),
          fecha: baseDate(1, 18),
          modalidad: 'virtual',
        },
      ],
      entradas: [
        {
          id: Math.random().toString(36).slice(2, 9),
          fecha: baseDate(-5, 22),
          texto:
            'Volví a despertarme a las 4. Pensé en el mail de mi jefe una y otra vez.',
          animo: 2,
          etiquetas: ['sueño', 'trabajo'],
          compartida: true,
          paraSesion: true,
        },
        {
          id: Math.random().toString(36).slice(2, 9),
          fecha: baseDate(-4, 21),
          texto:
            'Hice la respiración antes de dormir. Me costó, pero me dormí más rápido.',
          animo: 3,
          etiquetas: ['sueño', 'logro'],
          compartida: true,
          paraSesion: false,
        },
        {
          id: Math.random().toString(36).slice(2, 9),
          fecha: baseDate(-3, 20),
          texto:
            'Le dije que no a una reunión fuera de horario. Me sentí culpable, pero también aliviada.',
          animo: 4,
          etiquetas: ['trabajo', 'logro'],
          compartida: false,
          paraSesion: true,
        },
        {
          id: Math.random().toString(36).slice(2, 9),
          fecha: baseDate(-12, 22),
          texto: 'Discusión con mi hermana por el cumpleaños de mamá.',
          animo: 2,
          etiquetas: ['familia', 'vínculos'],
          compartida: false,
          paraSesion: true,
        },
        {
          id: Math.random().toString(36).slice(2, 9),
          fecha: baseDate(-15, 21),
          texto: 'Semana pesada. El pecho apretado casi todos los días.',
          animo: 2,
          etiquetas: ['cuerpo', 'trabajo'],
          compartida: false,
          paraSesion: false,
        },
        {
          id: Math.random().toString(36).slice(2, 9),
          fecha: baseDate(-20, 21),
          texto: 'Salí a caminar con una amiga. Me hizo bien hablar de otra cosa.',
          animo: 4,
          etiquetas: ['vínculos'],
          compartida: false,
          paraSesion: false,
        },
      ],
      objetivos: [
        {
          id: Math.random().toString(36).slice(2, 9),
          texto: res.cambioEsperado || 'Sentirme mejor en el día a día.',
          origen: 'primera charla',
          progreso: [2, 2, 3],
        },
        {
          id: Math.random().toString(36).slice(2, 9),
          texto: 'Poner límites con los horarios del trabajo.',
          origen: 'con tu profesional',
          progreso: [1, 3],
        },
      ],
      ejercicios: [
        {
          id: Math.random().toString(36).slice(2, 9),
          titulo: 'Respiración 4-6 antes de dormir',
          detalle:
            'Inhalá en 4 tiempos y exhalá en 6, durante 5 minutos, ya acostada.',
          quePaso:
            'Las primeras dos noches me distraje. La tercera me dormí antes de terminar.',
          fecha: baseDate(-3),
        },
        {
          id: Math.random().toString(36).slice(2, 9),
          titulo: 'Registro de pensamientos',
          detalle:
            'Cuando aparezca la preocupación por el trabajo, anotá qué pensaste, qué sentiste y qué hiciste.',
        },
      ],
      semanaCompartida: null,
      derivacion: { estado: 'ninguna' },
    },
  }
}

export function crearSesionDemoCompleta(): SesionPaciente {
  const base = crearSesionInicial()
  return activarDemoPaciente({
    ...base,
    etapa: 'enviado',
    elegidos: ['pro1', 'pro4'],
    contacto: {
      nombre: 'Lucía',
      via: 'whatsapp',
      valor: '+54 9 341 555-1201',
    },
  })
}

