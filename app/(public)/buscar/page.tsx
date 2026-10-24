import type { Metadata } from "next"

import { RoutePlaceholder } from "@/components/layout/route-placeholder"
import { routes } from "@/lib/navigation"

export const metadata: Metadata = { title: routes.search.label }

export default function Page() {
  return <RoutePlaceholder routeId="search" links={[{"href":"/profesionales/demo","label":"Ver un perfil de ejemplo"}]} />
}
