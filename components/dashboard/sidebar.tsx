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
  Printer,
  Sparkles,
  FileCheck,
  FilePlus,
  LineChart,
  BarChart3,
  GitBranch,
  Calendar,
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Percent,
  Calculator,
  UserPlus,
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

// Sidebar v2.2 - Facturación en Principal
const navigationSections: NavigationSection[] = [
  {
    title: 'Principal',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Avanzado', href: '/advanced', icon: Sparkles },
      { name: 'Generar factura', href: '/invoices/new', icon: FilePlus },
      { name: 'Seguimiento de cobros', href: '/invoices', icon: FileCheck },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { name: 'Patrimonio Neto', href: '/net-worth', icon: LineChart },
      { name: 'Análisis de Flujo', href: '/flow', icon: GitBranch },
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
      { name: 'Impuestos (IVA/IRP)', href: '/taxes', icon: Percent },
    ],
  },
  {
    title: 'Planificación',
    items: [
      { name: 'Presupuestos', href: '/budgets', icon: Target },
      { name: 'Objetivos SMART', href: '/goals', icon: PiggyBank },
      { name: 'Suscripciones', href: '/subscriptions', icon: Repeat },
      { name: 'Calculadora Financiera', href: '/financial-calculator', icon: Calculator },
    ],
  },
  {
    title: 'Emprendedor',
    items: [
      { name: 'Prospectos', href: '/prospects', icon: UserPlus },
      { name: 'Clientes', href: '/clients', icon: Users },
      { name: 'Proyectos', href: '/projects', icon: FolderKanban },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { name: 'Balance Financiero', href: '/rules', icon: Printer },
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
      {/* Desktop Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 bottom-0 z-50 flex-col hidden md:flex border-r transition-all duration-300",
        "bg-card",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {!isCollapsed ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold">Finanzas</span>
              </Link>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapsed}
                className="h-8 w-8 flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              className="h-8 w-8 mx-auto"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto py-4 px-3">
          <nav className="flex flex-col gap-1">
            {navigationSections.map((section) => {
              const isSectionCollapsed = collapsedSections.includes(section.title)
              
              return (
                <div key={section.title} className="mb-2">
                  {!isCollapsed && (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      <span>{section.title}</span>
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 transition-transform',
                          isSectionCollapsed && 'transform rotate-180'
                        )}
                      />
                    </button>
                  )}

                  {!isCollapsed && !isSectionCollapsed && (
                    <div className="flex flex-col gap-0.5 mt-1">
                      {section.items.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                              isActive 
                                ? 'bg-primary text-primary-foreground shadow-sm' 
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                  
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
                              'flex items-center justify-center rounded-lg p-2 transition-all mx-2',
                              isActive 
                                ? 'bg-primary text-primary-foreground shadow-sm' 
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                          >
                            <item.icon className="h-4 w-4" />
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
      <div className="fixed inset-x-0 bottom-0 z-50 flex h-16 md:hidden border-t bg-card">
        <nav className="flex flex-row items-center justify-around w-full px-2">
          {navigationSections[0].items.slice(0, 2).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg p-2 transition-colors min-w-[60px]',
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-accent'
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
                  'flex flex-col items-center justify-center rounded-lg p-2 transition-colors min-w-[60px]',
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-accent'
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
