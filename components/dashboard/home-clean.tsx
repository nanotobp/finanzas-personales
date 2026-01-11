'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getMonthEndDate } from '@/lib/utils'
import { 
  ChevronRight, 
  Home as HomeIcon, 
  Users, 
  Heart, 
  Zap, 
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  UserCircle,
  Target
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// Componente para stats rápidos con datos reales
function QuickStats() {
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', currentMonth],
    queryFn: async () => {
      const { getCurrentMonthIncomeExpenses } = await import('@/lib/services/dashboard-service')
      return getCurrentMonthIncomeExpenses(currentMonth)
    },
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">Ingresos</p>
        <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
          {formatCurrency(stats?.income || 0)}
        </p>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-500" />
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">Gastos</p>
        <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
          {formatCurrency(stats?.expenses || 0)}
        </p>
      </div>
    </div>
  )
}

const categoryIcons: Record<string, any> = {
  'home': HomeIcon,
  'house': HomeIcon,
  'family': Users,
  'health': Heart,
  'utilities': Zap,
  'clothing': ShoppingBag,
  'default': Target
}

const categoryColors = [
  { bg: 'bg-emerald-500/10', icon: 'text-emerald-500', ring: 'ring-emerald-500/20', progress: 'bg-emerald-500' },
  { bg: 'bg-blue-500/10', icon: 'text-blue-500', ring: 'ring-blue-500/20', progress: 'bg-blue-500' },
  { bg: 'bg-purple-500/10', icon: 'text-purple-500', ring: 'ring-purple-500/20', progress: 'bg-purple-500' },
  { bg: 'bg-orange-500/10', icon: 'text-orange-500', ring: 'ring-orange-500/20', progress: 'bg-orange-500' },
  { bg: 'bg-pink-500/10', icon: 'text-pink-500', ring: 'ring-pink-500/20', progress: 'bg-pink-500' },
]

export function HomeClean() {
  const router = useRouter()
  const supabase = createClient()
  const currentMonth = new Date().toISOString().slice(0, 7)

  // Obtener balance total
  const { data: totalBalance, isLoading: loadingBalance } = useQuery({
    queryKey: ['total-balance'],
    queryFn: async () => {
      const { getTotalBalance } = await import('@/lib/services/dashboard-service')
      return getTotalBalance()
    },
  })

  // Obtener presupuestos con gastos
  const { data: budgets, isLoading: loadingBudgets } = useQuery({
    queryKey: ['home-budgets', currentMonth],
    queryFn: async () => {
      const startDate = `${currentMonth}-01`
      const endDate = getMonthEndDate(currentMonth)

      const [budgetsRes, expensesRes] = await Promise.all([
        supabase
          .from('budgets')
          .select('*, categories(name, icon)')
          .eq('month', currentMonth)
          .or(`end_date.is.null,end_date.gte.${currentMonth}`)
          .order('amount', { ascending: false })
          .limit(5),
        supabase
          .from('transactions')
          .select('amount, category_id')
          .eq('type', 'expense')
          .gte('date', startDate)
          .lte('date', endDate)
      ])

      const budgetsData = budgetsRes.data || []
      const expenses = expensesRes.data || []

      return budgetsData.map((budget, idx) => {
        const spent = expenses
          .filter(e => e.category_id === budget.category_id)
          .reduce((sum, e) => sum + Number(e.amount), 0)

        const percentage = budget.amount > 0 ? (spent / Number(budget.amount)) * 100 : 0
        const iconKey = budget.categories?.icon?.toLowerCase() || 'default'
        const Icon = categoryIcons[iconKey] || categoryIcons.default
        const colors = categoryColors[idx % categoryColors.length]

        return {
          id: budget.id,
          category: budget.categories?.name || 'Sin nombre',
          current: spent,
          total: Number(budget.amount),
          percentage: Math.round(percentage),
          Icon,
          ...colors
        }
      })
    },
  })

  if (loadingBalance || loadingBudgets) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 pt-8 pb-24">
        <div className="max-w-md mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 pt-8 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inicio</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button 
            onClick={() => router.push('/user-profile')}
            className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center hover:shadow-lg transition-shadow"
          >
            <UserCircle className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-3xl p-6 shadow-xl shadow-blue-500/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Balance Total</p>
              <h2 className="text-3xl font-bold text-white">{formatCurrency(totalBalance || 0)}</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-4 border-t border-white/20">
            <div className="flex items-center gap-1 text-white/90">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Últimos 30 días</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <QuickStats />

        {/* Presupuestos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Presupuestos</h3>
            <button className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Ver todos
            </button>
          </div>

          <div className="space-y-3">
            {budgets && budgets.length > 0 ? (
              budgets.map((budget) => (
                <div
                  key={budget.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl ${budget.bg} dark:${budget.bg} flex items-center justify-center ring-1 ${budget.ring}`}>
                      <budget.Icon className={`w-5 h-5 ${budget.icon}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">{budget.category}</h4>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {budget.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            budget.percentage > 90 ? 'bg-rose-500' : 
                            budget.percentage > 70 ? 'bg-amber-500' : 
                            budget.progress
                          }`}
                          style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                        {formatCurrency(budget.current)} de {formatCurrency(budget.total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-700">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-900 dark:text-white font-medium">No hay presupuestos</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Crea un presupuesto para comenzar
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
