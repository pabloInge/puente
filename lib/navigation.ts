import { icons, type IconComponent } from '@/components/ui/icon'

export type Role = 'patient' | 'professional' | 'admin'
export type Area = 'public' | 'auth' | Role | 'session'

export type RouteDef = {
  id: string
  href: string
  label: string
  description: string
  icon: IconComponent
  area: Area
  /** Tarea del roadmap que implementa la ruta (doc 06). */
  task: string
  /** primary: navegación inferior en mobile. secondary: solo lateral o menú "Más". */
  nav?: 'primary' | 'secondary'
  /** Ruta con segmento dinámico: se usa `sample` para navegar en la demo. */
  sample?: string
  /** Pestañas de la ficha del paciente. */
  parent?: string
}

const r = (def: RouteDef) => def

export const routes = {
  home: r({ id: 'home', href: '/', label: 'Inicio', description: 'Encontrá un profesional de la psicología.', icon: icons.House, area: 'public', task: 'A-02' }),
  search: r({ id: 'search', href: '/buscar', label: 'Buscar', description: 'Filtros y búsqueda en lenguaje natural.', icon: icons.Search, area: 'public', task: 'A-02' }),
  professionalProfile: r({ id: 'professionalProfile', href: '/profesionales/[id]', sample: '/profesionales/demo', label: 'Perfil profesional', description: 'Ramas, enfoques, atenciones y disponibilidad.', icon: icons.UserRound, area: 'public', task: 'A-01' }),

  signIn: r({ id: 'signIn', href: '/ingresar', label: 'Ingresar', description: 'Iniciá sesión en tu cuenta.', icon: icons.LogIn, area: 'auth', task: 'F1-04' }),
  signUp: r({ id: 'signUp', href: '/registro', label: 'Crear cuenta', description: 'Registrate como paciente o profesional.', icon: icons.UserPlus, area: 'auth', task: 'F1-04' }),

  patientHome: r({ id: 'patientHome', href: '/paciente', label: 'Inicio', description: 'Próximo turno, indicaciones y diario.', icon: icons.House, area: 'patient', task: 'F3-01', nav: 'primary' }),
  patientJournal: r({ id: 'patientJournal', href: '/paciente/diario', label: 'Diario', description: 'Registrá conflictos, necesidades y cómo te sentís.', icon: icons.NotebookPen, area: 'patient', task: 'D-02', nav: 'primary' }),
  patientAppointments: r({ id: 'patientAppointments', href: '/paciente/turnos', label: 'Turnos', description: 'Tus turnos y sesiones online.', icon: icons.CalendarDays, area: 'patient', task: 'B-02', nav: 'primary' }),
  patientMessages: r({ id: 'patientMessages', href: '/paciente/mensajes', label: 'Mensajes', description: 'Conversaciones con profesionales.', icon: icons.MessageSquare, area: 'patient', task: 'A-03', nav: 'primary' }),
  patientConversation: r({ id: 'patientConversation', href: '/paciente/mensajes/[conversationId]', sample: '/paciente/mensajes/demo', label: 'Conversación', description: 'Mensajes con un profesional.', icon: icons.MessageSquare, area: 'patient', task: 'A-03' }),
  patientTreatment: r({ id: 'patientTreatment', href: '/paciente/tratamiento', label: 'Tratamiento', description: 'Indicaciones y recursos de tu profesional.', icon: icons.ClipboardList, area: 'patient', task: 'D-01', nav: 'secondary' }),
  patientProfessionals: r({ id: 'patientProfessionals', href: '/paciente/profesionales', label: 'Mi profesional', description: 'Vínculo actual y solicitudes.', icon: icons.Handshake, area: 'patient', task: 'A-04', nav: 'secondary' }),
  patientProgress: r({ id: 'patientProgress', href: '/paciente/progreso', label: 'Progreso', description: 'Tu progreso en el tratamiento.', icon: icons.TrendingUp, area: 'patient', task: 'E-03', nav: 'secondary' }),
  patientHistory: r({ id: 'patientHistory', href: '/paciente/historial', label: 'Historial', description: 'Experiencias pasadas, resúmenes de cierre y copias de historia clínica.', icon: icons.History, area: 'patient', task: 'A-01 · E-04 · C-04', nav: 'secondary' }),
  patientProfile: r({ id: 'patientProfile', href: '/paciente/perfil', label: 'Perfil', description: 'Datos personales y cobertura.', icon: icons.CircleUser, area: 'patient', task: 'A-01', nav: 'secondary' }),

  proHome: r({ id: 'proHome', href: '/profesional', label: 'Inicio', description: 'Agenda del día, solicitudes y diarios no leídos.', icon: icons.House, area: 'professional', task: 'F3-01', nav: 'primary' }),
  proAgenda: r({ id: 'proAgenda', href: '/profesional/agenda', label: 'Agenda', description: 'Turnos, atenciones y disponibilidad.', icon: icons.CalendarDays, area: 'professional', task: 'B-01 · B-02', nav: 'primary' }),
  proPatients: r({ id: 'proPatients', href: '/profesional/pacientes', label: 'Pacientes', description: 'Vínculos activos y finalizados.', icon: icons.Users, area: 'professional', task: 'C-03', nav: 'primary' }),
  proMessages: r({ id: 'proMessages', href: '/profesional/mensajes', label: 'Mensajes', description: 'Conversaciones con pacientes.', icon: icons.MessageSquare, area: 'professional', task: 'A-03', nav: 'primary' }),
  proConversation: r({ id: 'proConversation', href: '/profesional/mensajes/[conversationId]', sample: '/profesional/mensajes/demo', label: 'Conversación', description: 'Mensajes con un paciente.', icon: icons.MessageSquare, area: 'professional', task: 'A-03' }),
  proRequests: r({ id: 'proRequests', href: '/profesional/solicitudes', label: 'Solicitudes', description: 'Pedidos de vínculo pendientes.', icon: icons.Inbox, area: 'professional', task: 'A-04', nav: 'secondary' }),
  proTemplates: r({ id: 'proTemplates', href: '/profesional/plantillas', label: 'Plantillas', description: 'Plantillas de historia clínica.', icon: icons.FileText, area: 'professional', task: 'C-02', nav: 'secondary' }),
  proProfile: r({ id: 'proProfile', href: '/profesional/perfil', label: 'Perfil', description: 'Perfil público y publicación.', icon: icons.CircleUser, area: 'professional', task: 'A-01', nav: 'secondary' }),

  bond: r({ id: 'bond', href: '/profesional/pacientes/[bondId]', sample: '/profesional/pacientes/demo', label: 'Ficha', description: 'Datos del paciente y línea de tiempo.', icon: icons.IdCard, area: 'professional', task: 'C-03' }),
  bondClinical: r({ id: 'bondClinical', href: '/profesional/pacientes/[bondId]/historia-clinica', label: 'Historia clínica', description: 'Entradas y enmiendas.', icon: icons.FileHeart, area: 'professional', task: 'C-01', parent: 'bond' }),
  bondJournal: r({ id: 'bondJournal', href: '/profesional/pacientes/[bondId]/diario', label: 'Diario', description: 'Diario del paciente por semana.', icon: icons.NotebookPen, area: 'professional', task: 'D-03', parent: 'bond' }),
  bondIndications: r({ id: 'bondIndications', href: '/profesional/pacientes/[bondId]/indicaciones', label: 'Indicaciones', description: 'Indicaciones y recursos.', icon: icons.ClipboardList, area: 'professional', task: 'D-01', parent: 'bond' }),
  bondSummaries: r({ id: 'bondSummaries', href: '/profesional/pacientes/[bondId]/resumenes', label: 'Resúmenes', description: 'Resúmenes semanales e histórico.', icon: icons.ScrollText, area: 'professional', task: 'E-01 · E-02', parent: 'bond' }),
  bondProgress: r({ id: 'bondProgress', href: '/profesional/pacientes/[bondId]/progreso', label: 'Progreso', description: 'Formato, visibilidad y registro.', icon: icons.TrendingUp, area: 'professional', task: 'E-03', parent: 'bond' }),
  bondClosing: r({ id: 'bondClosing', href: '/profesional/pacientes/[bondId]/cierre', label: 'Cierre', description: 'Resumen de cierre del vínculo.', icon: icons.FileCheck, area: 'professional', task: 'E-04', parent: 'bond' }),

  adminHome: r({ id: 'adminHome', href: '/admin', label: 'Inicio', description: 'Contadores de catálogo y usuarios.', icon: icons.LayoutDashboard, area: 'admin', task: 'F3-01', nav: 'primary' }),
  adminBranches: r({ id: 'adminBranches', href: '/admin/ramas', label: 'Ramas y enfoques', description: 'Ramas, subramas y enfoques.', icon: icons.GitBranch, area: 'admin', task: 'G-01', nav: 'primary' }),
  adminCoverages: r({ id: 'adminCoverages', href: '/admin/coberturas', label: 'Coberturas', description: 'Coberturas, programas y bonificaciones.', icon: icons.ShieldCheck, area: 'admin', task: 'G-01', nav: 'secondary' }),
  adminConsents: r({ id: 'adminConsents', href: '/admin/consentimientos', label: 'Consentimientos', description: 'Consentimiento, términos y privacidad.', icon: icons.FileSignature, area: 'admin', task: 'G-02', nav: 'secondary' }),
  adminTemplates: r({ id: 'adminTemplates', href: '/admin/plantillas', label: 'Plantillas', description: 'Plantillas globales.', icon: icons.FileText, area: 'admin', task: 'G-02', nav: 'secondary' }),
  adminSettings: r({ id: 'adminSettings', href: '/admin/configuracion', label: 'Configuración', description: 'Parámetros de la plataforma.', icon: icons.Settings, area: 'admin', task: 'G-02', nav: 'secondary' }),
  adminUsers: r({ id: 'adminUsers', href: '/admin/usuarios', label: 'Usuarios', description: 'Suspensión y reactivación.', icon: icons.UserCog, area: 'admin', task: 'G-03', nav: 'primary' }),
  adminAudit: r({ id: 'adminAudit', href: '/admin/auditoria', label: 'Auditoría', description: 'Registro de auditoría.', icon: icons.ListChecks, area: 'admin', task: 'G-03', nav: 'primary' }),

  session: r({ id: 'session', href: '/sesion/[appointmentId]', sample: '/sesion/demo', label: 'Sesión online', description: 'Sala de videollamada del turno.', icon: icons.Video, area: 'session', task: 'B-05' }),
} satisfies Record<string, RouteDef>

export type RouteId = keyof typeof routes

export const roleHome: Record<Role, string> = {
  patient: routes.patientHome.href,
  professional: routes.proHome.href,
  admin: routes.adminHome.href,
}

export const roleLabel: Record<Role, string> = {
  patient: 'Paciente',
  professional: 'Profesional',
  admin: 'Administración',
}

const all = Object.values(routes) as RouteDef[]

export function navFor(role: Role) {
  const items = all.filter((route) => route.area === role && route.nav)
  return {
    primary: items.filter((route) => route.nav === 'primary'),
    secondary: items.filter((route) => route.nav === 'secondary'),
    all: items,
  }
}

export function bondTabs(bondId: string) {
  return [routes.bond, ...all.filter((route) => route.parent === 'bond')].map((route) => ({
    ...route,
    href: route.href.replace('[bondId]', bondId),
  }))
}

/** Ítem activo: el de prefijo más largo que coincide con la ruta actual. */
export function activeHref(pathname: string, hrefs: string[]) {
  return hrefs
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0]
}

export function routeById(id: RouteId): RouteDef {
  return routes[id]
}

export function allRoutes() {
  return all
}
