'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Target, Plus, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    label: 'Perfil',
    href: '/profile',
    icon: User,
  },
]

interface BottomNavigationProps {
  onAddClick?: () => void
}

export function BottomNavigation({ onAddClick }: BottomNavigationProps) {
  const pathname = usePathname()

  const handleAddClick = () => {
    onAddClick?.()
  }

  return (
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
  )
}
