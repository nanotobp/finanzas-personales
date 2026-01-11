'use client'

import { BottomNavigation } from '@/components/dashboard/bottom-navigation'

interface DashboardLayoutCleanProps {
  children: React.ReactNode
  user: {
    email?: string
  }
}

export function DashboardLayoutClean({ children, user }: DashboardLayoutCleanProps) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
