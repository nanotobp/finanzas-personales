'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  Wallet,
  CreditCard,
  Target,
  Repeat,
  Users,
  FolderKanban,
  Zap,
  FileText,
  Settings,
  Receipt,
  PiggyBank,
  Sparkles,
  LineChart,
  BarChart3,
  GitBranch,
  Calendar,
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useSidebarPreferences, colorGradients } from '@/hooks/use-sidebar-preferences'
import { Button } from '@/components/ui/button'

interface NavigationSection {
  title: string
  items: {
    name: string
    href: string
    icon: any
  }[]
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Principal',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Avanzado', href: '/advanced', icon: Sparkles },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { name: 'Patrimonio Neto', href: '/net-worth', icon: LineChart },
      { name: 'Flujo de Dinero', href: '/money-flow', icon: GitBranch },
      { name: 'Cash Flow', href: '/cash-flow', icon: BarChart3 },
      { name: 'Actividad', href: '/activity', icon: Calendar },
      { name: 'Tasa de Ahorro', href: '/savings-rate', icon: Activity },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { name: 'Gastos', href: '/expenses', icon: TrendingDown },
      { name: 'Ingresos', href: '/income', icon: TrendingUp },
      { name: 'Cuentas', href: '/accounts', icon: Wallet },
      { name: 'Tarjetas', href: '/cards', icon: CreditCard },
    ],
  },
  {
    title: 'Planificación',
    items: [
      { name: 'Presupuestos', href: '/budgets', icon: Target },
      { name: 'Objetivos SMART', href: '/goals', icon: PiggyBank },
      { name: 'Suscripciones', href: '/subscriptions', icon: Repeat },
    ],
  },
  {
    title: 'Emprendedor',
    items: [
      { name: 'Clientes', href: '/clients', icon: Users },
      { name: 'Cobros', href: '/invoices', icon: Receipt },
      { name: 'Proyectos', href: '/projects', icon: FolderKanban },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { name: 'Reglas', href: '/rules', icon: Zap },
      { name: 'Reportes', href: '/reports', icon: FileText },
      { name: 'Configuración', href: '/settings', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsedSections, setCollapsedSections] = useState<string[]>([])
  const { isCollapsed, color, toggleCollapsed } = useSidebarPreferences()
  const gradient = colorGradients[color as keyof typeof colorGradients] || colorGradients.violet

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    )
  }

  return (
    <>
      {/* Desktop Sidebar - Con texto y secciones colapsables */}
      <div className={cn(
        "fixed top-0 left-0 bottom-0 z-50 flex-col hidden md:flex bg-gradient-to-b border-r border-white/10 transition-all duration-300",
        gradient,
        isCollapsed ? "w-20" : "w-64"
      )}>
        {/* Logo */}
        <div className="flex h-[88px] items-center justify-between px-4 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold text-white">Finanzas</span>
            )}
          </Link>
          
          {/* Collapse Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className={cn(
              "h-8 w-8 text-white hover:bg-white/10 rounded-full flex-shrink-0",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto py-4 px-3">
          <nav className="flex flex-col gap-1">
            {navigationSections.map((section) => {
              const isSectionCollapsed = collapsedSections.includes(section.title)
              
              return (
                <div key={section.title} className="mb-2">
                  {/* Section Header - Ocultar cuando sidebar está colapsado */}
                  {!isCollapsed && (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-white/60 uppercase tracking-wider hover:text-white/80 transition-colors"
                    >
                      <span>{section.title}</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isSectionCollapsed && 'transform rotate-180'
                        )}
                      />
                    </button>
                  )}

                  {/* Section Items */}
                  {!isCollapsed && !isSectionCollapsed && (
                    <div className="flex flex-col gap-0.5 mt-1">
                      {section.items.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all',
                              isActive && 'bg-white/20 text-white shadow-lg'
                            )}
                          >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                  
                  {/* Collapsed View - Only Icons */}
                  {isCollapsed && (
                    <div className="flex flex-col gap-1 mt-1">
                      {section.items.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            title={item.name}
                            className={cn(
                              'flex items-center justify-center rounded-lg p-2.5 text-white/70 hover:bg-white/10 hover:text-white transition-all mx-2',
                              isActive && 'bg-white/20 text-white shadow-lg'
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex h-16 md:hidden rounded-t-3xl shadow-2xl border-t border-white/10 bg-gradient-to-r",
        gradient
      )}>
        <nav className="flex flex-row items-center justify-around w-full px-2">
          {navigationSections[0].items.slice(0, 2).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors min-w-[60px]',
                  isActive && 'bg-white/20 text-white'
                )}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            )
          })}
          {navigationSections[2].items.slice(0, 3).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors min-w-[60px]',
                  isActive && 'bg-white/20 text-white'
                )}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium truncate max-w-[60px]">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
