'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function DemoSwitch() {
  const pathname = usePathname() || '/'

  const links = [
    { href: '/', label: 'Inicio' },
    { href: '/consulta', label: 'Consulta' },
    { href: '/mi', label: 'Paciente' },
    { href: '/pro', label: 'Profesional' },
    { href: '/ingresar', label: 'Ingresar' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      aria-label="Vistas de la demo"
      className="demo-switch flex items-center justify-center gap-1 overflow-x-auto border-b border-linea bg-tinta px-4 py-1.5 text-xs print:hidden"
    >
      {links.map(({ href, label }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-full px-3 py-1.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-azul ${
              active ? 'bg-white text-tinta' : 'text-white/75 hover:text-white'
            }`}
          >
            {label}
          </Link>
        )
      })}
      <span className="ml-2 hidden text-white/50 sm:inline">
        Vista previa · datos de ejemplo
      </span>
    </nav>
  )
}
