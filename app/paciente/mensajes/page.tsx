import type { Metadata } from "next"

import { RoutePlaceholder } from "@/components/layout/route-placeholder"
import { routes } from "@/lib/navigation"

export const metadata: Metadata = { title: routes.patientMessages.label }

export default function Page() {
  return <RoutePlaceholder routeId="patientMessages" links={[{"href":"/paciente/mensajes/demo","label":"Abrir conversación de ejemplo"}]} />
}
