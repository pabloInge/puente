import { BondTabs } from '@/components/layout/bond-tabs'
import { bondTabs } from '@/lib/navigation'

export default async function BondLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ bondId: string }>
}) {
  const { bondId } = await params
  const tabs = bondTabs(bondId).map(({ id, href, label }) => ({ id, href, label }))

  return (
    <div className="flex flex-col gap-6">
      <BondTabs tabs={tabs} />
      {children}
    </div>
  )
}
