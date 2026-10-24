import type { Metadata } from "next"

import { RoutePlaceholder } from "@/components/layout/route-placeholder"
import { routes } from "@/lib/navigation"

export const metadata: Metadata = { title: routes.proAgenda.label }

export default function Page() {
  return <RoutePlaceholder routeId="proAgenda" links={[{"href":"/sesion/demo","label":"Ver la sala de ejemplo"}]} />
}
