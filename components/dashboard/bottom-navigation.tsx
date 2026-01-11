'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Sparkles, TrendingDown, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProspectFormDialog } from '@/components/prospects/prospect-form-dialog'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Avanzado',
    href: '/advanced',
    icon: Sparkles,
  },
  {
    label: 'Gastos',
    href: '/expenses',
    icon: TrendingDown,
  },
  {
    label: 'CRM',
    href: '#crm',
    icon: BarChart3,
  },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const [prospectFormOpen, setProspectFormOpen] = useState(false)

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe">
        <div className="max-w-md mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item, index) => {
              // Botón CRM - abre formulario
              if (item.label === 'CRM') {
                return (
                  <button
                    key="crm-button"
                    onClick={() => setProspectFormOpen(true)}
                    className="flex flex-col items-center justify-center gap-1 min-w-[60px] py-2 transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    <item.icon className="w-5 h-5" strokeWidth={2} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                )
              }

              const isActive = item.href === '/dashboard' 
                ? pathname === '/dashboard' || pathname === '/'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[60px] py-2 transition-all",
                  isActive 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <item.icon 
                  className={cn(
                    "w-5 h-5 transition-all",
                    isActive && "scale-110"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
          </div>
        </div>
      </nav>
      
      <ProspectFormDialog 
        open={prospectFormOpen} 
        onOpenChange={setProspectFormOpen}
      />
    </>
  )
}
