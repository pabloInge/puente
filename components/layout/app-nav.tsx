'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { Icon, icons } from '@/components/ui/icon'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { activeHref, navFor, roleLabel, type RouteDef, type Role } from '@/lib/navigation'
import { cn } from '@/lib/utils'

function useActive(items: RouteDef[]) {
  const pathname = usePathname()
  return activeHref(
    pathname,
    items.map((item) => item.href),
  )
}

export function SidebarNav({ role }: { role: Role }) {
  const { primary, secondary } = navFor(role)
  const active = useActive([...primary, ...secondary])

  return (
    <nav aria-label={`Navegación de ${roleLabel[role]}`} className="flex flex-col gap-6">
      {[primary, secondary].map((group, index) => (
        <ul key={index} className="flex flex-col gap-1">
          {group.map((item) => {
            const isActive = item.href === active
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground outline-none transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
                    isActive &&
                      'bg-surface-2 font-medium text-foreground before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-primary',
                  )}
                >
                  <Icon icon={item.icon} size="md" className={cn(isActive && 'text-primary')} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      ))}
    </nav>
  )
}

export function BottomNav({ role }: { role: Role }) {
  const { primary, secondary } = navFor(role)
  const active = useActive([...primary, ...secondary])
  const [open, setOpen] = useState(false)
  const moreActive = secondary.some((item) => item.href === active)
  const visible = primary.slice(0, 4)

  const itemClass = (isActive: boolean) =>
    cn(
      'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
      isActive && 'font-medium text-primary',
    )

  return (
    <nav
      aria-label={`Navegación de ${roleLabel[role]}`}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex">
        {visible.map((item) => (
          <li key={item.id} className="flex flex-1">
            <Link href={item.href} aria-current={item.href === active ? 'page' : undefined} className={itemClass(item.href === active)}>
              <Icon icon={item.icon} size="md" />
              {item.label}
            </Link>
          </li>
        ))}
        {secondary.length > 0 && (
          <li className="flex flex-1">
            <button type="button" onClick={() => setOpen(true)} className={itemClass(moreActive)} aria-haspopup="dialog">
              <Icon icon={icons.Menu} size="md" />
              Más
            </button>
          </li>
        )}
      </ul>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-xl pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle>Más secciones</SheetTitle>
          </SheetHeader>
          <ul className="flex flex-col gap-1 px-2 pb-4">
            {[...primary.slice(4), ...secondary].map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={item.href === active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-foreground outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring',
                    item.href === active && 'bg-surface-2 font-medium text-primary',
                  )}
                >
                  <Icon icon={item.icon} size="md" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
