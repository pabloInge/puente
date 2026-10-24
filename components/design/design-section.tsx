import type { ReactNode } from 'react'

type DesignSectionProps = {
  title: string
  description?: string
  children: ReactNode
}

export function DesignSection({ title, description, children }: DesignSectionProps) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby={`section-${title}`}>
      <header className="flex flex-col gap-1">
        <h2 id={`section-${title}`} className="text-lg font-semibold">
          {title}
        </h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </header>
      {children}
    </section>
  )
}
