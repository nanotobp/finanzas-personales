'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { ShoppingBag, Zap, Car, Home, DollarSign, TrendingUp } from 'lucide-react'

const iconMap: Record<string, any> = {
  'shopping': ShoppingBag,
  'transport': Car,
  'home': Home,
  'utilities': Zap,
  'default': DollarSign
}

const colorMap = [
  { color: 'bg-emerald-500', lightColor: 'bg-emerald-100 dark:bg-emerald-950' },
  { color: 'bg-cyan-500', lightColor: 'bg-cyan-100 dark:bg-cyan-950' },
  { color: 'bg-blue-500', lightColor: 'bg-blue-100 dark:bg-blue-950' },
  { color: 'bg-violet-500', lightColor: 'bg-violet-100 dark:bg-violet-950' },
]

export function MonthlyBudgetsCard() {
  const supabase = createClient()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['monthly-budgets', currentMonth],
    queryFn: async () => {
      const startDate = `${currentMonth}-01`
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
        .toISOString().split('T')[0]

      const [budgetsRes, expensesRes] = await Promise.all([
        supabase
          .from('budgets')
          .select('*, categories(name, icon)')
          .eq('month', currentMonth)
          .or(`end_date.is.null,end_date.gte.${currentMonth}`)
          .limit(4),
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

        const colors = colorMap[idx % colorMap.length]
        return {
          category: budget.categories?.name || 'Sin nombre',
          current: spent,
          total: Number(budget.amount),
          icon: iconMap[budget.categories?.icon || 'default'] || DollarSign,
          ...colors
        }
      })
    },
  })

  if (isLoading) {
    return (
      <Card className="shadow-none p-0 border-0">
        <CardHeader className="p-0 pb-5">
          <CardTitle>Presupuestos Mensuales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-0">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!budgets || budgets.length === 0) {
    return (
      <Card className="shadow-none p-0 border-0">
        <CardHeader className="p-0 pb-5">
          <CardTitle>Presupuestos Mensuales</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-8 text-muted-foreground text-sm">
            No hay presupuestos configurados
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-none p-0 border-0">
      <CardHeader className="p-0 pb-5">
        <CardTitle>Presupuestos Mensuales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {budgets.map((budget) => {
          const Icon = budget.icon
          const percentage = budget.total > 0 ? (budget.current / budget.total) * 100 : 0
          return (
            <div key={budget.category} className="space-y-3 bg-card p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <div className={`${budget.lightColor} p-2.5 rounded-full`}>
                  <Icon className={`h-4 w-4 ${budget.color} text-white rounded-full`} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-semibold">{budget.category}</span>
                <span className="text-sm text-muted-foreground ml-auto font-medium">
                  {formatCurrency(budget.current)} / {formatCurrency(budget.total)}
                </span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${budget.color} transition-all duration-500 ease-out`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
