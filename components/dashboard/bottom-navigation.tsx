'use client'

import { useState, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Target, Plus, Bell, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProspectFormDialog } from '@/components/prospects/prospect-form-dialog'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { prefetchRouteData } from '@/lib/prefetch/route-data'

const navItems = [
  {
    label: 'Inicio',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'Objetivos',
    href: '/goals',
    icon: Target,
  },
  {
    label: 'add', // Special item for center button
    href: '#',
    icon: Plus,
  },
  {
    label: 'Vencimientos',
    href: '/subscriptions',
    icon: Bell,
  },
  {
    label: 'CRM',
    href: '#crm',
    icon: BarChart3,
  },
]

interface BottomNavigationProps {
  onAddClick?: () => void
}

export function BottomNavigation({ onAddClick }: BottomNavigationProps) {
  const { pathname } = useLocation()
  const [prospectFormOpen, setProspectFormOpen] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { userId } = useAuth()
  const prefetchedRoutes = useRef(new Set<string>())

  const handlePrefetch = (href: string) => {
    if (prefetchedRoutes.current.has(href)) return
    prefetchedRoutes.current.add(href)
    void prefetchRouteData({ route: href, queryClient, supabase, userId })
  }

  const handleAddClick = () => {
    onAddClick?.()
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe">
        <div className="max-w-md mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item, index) => {
              // Centro - Botón de agregar especial
              if (item.label === 'add') {
                return (
                  <button
                    key="add-button"
                    onClick={handleAddClick}
                    className="relative -mt-6 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all active:scale-95"
                    aria-label="Agregar transacción"
                  >
                    <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </button>
                )
              }

              // Botón CRM - abre formulario de prospecto
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
                to={item.href}
                onMouseEnter={() => handlePrefetch(item.href)}
                onFocus={() => handlePrefetch(item.href)}
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
