import { AppShell } from '@/components/layout/app-shell'

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="professional">{children}</AppShell>
}
