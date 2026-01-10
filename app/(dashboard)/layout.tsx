import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayoutClean } from '@/components/dashboard/dashboard-layout-clean'
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client'
import { DashboardLayoutSelector } from '@/components/dashboard/dashboard-layout-selector'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <DashboardLayoutSelector user={user}>
      {children}
    </DashboardLayoutSelector>
  )
}
