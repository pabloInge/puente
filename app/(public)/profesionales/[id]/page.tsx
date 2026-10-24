import type { Metadata } from "next"

import { RoutePlaceholder } from "@/components/layout/route-placeholder"
import { routes } from "@/lib/navigation"

export const metadata: Metadata = { title: routes.professionalProfile.label }

export default function Page() {
  return <RoutePlaceholder routeId="professionalProfile" />
}
