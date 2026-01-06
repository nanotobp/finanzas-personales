'use client'

import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { QuickAddButton } from '@/components/dashboard/quick-add-button'
import { useSidebarPreferences } from '@/hooks/use-sidebar-preferences'
import { cn } from '@/lib/utils'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  user: {
    email?: string
  }
}

export function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
  const { isCollapsed } = useSidebarPreferences()

  return (
    <div className="relative min-h-screen">
      <Sidebar />
      <Header user={user} />
      <div className={cn(
        "pt-[88px] pb-20 transition-all duration-300",
        isCollapsed ? "md:pl-20" : "md:pl-64"
      )}>
        <main className="min-h-[calc(100vh-88px-64px)] container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 space-y-6 sm:space-y-8">
            {children}
          </div>
        </main>
      </div>
      <QuickAddButton />
    </div>
  )
}
