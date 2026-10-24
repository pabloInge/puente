'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

export function BondTabs({ tabs }: { tabs: { id: string; href: string; label: string }[] }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Secciones de la ficha" className="-mx-4 overflow-x-auto border-b border-border px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <li key={tab.id}>
              <Link
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex h-11 items-center px-3 text-sm whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
                  isActive && 'font-medium text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary',
                )}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
