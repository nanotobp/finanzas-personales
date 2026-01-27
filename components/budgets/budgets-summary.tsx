'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, getMonthEndDate } from '@/lib/utils'
import { Target, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export function BudgetsSummary() {
  const supabase = createClient()
  const currentMonth = new Date().toISOString().slice(0, 7)
  const { userId } = useAuth()

  const { data: stats } = useQuery({
    queryKey: ['budgets-summary', currentMonth],
    queryFn: async () => {
      const startDate = `${currentMonth}-01`
      const endDate = getMonthEndDate(currentMonth)

      if (!userId) {
        return { totalBudget: 0, totalBudgets: 0, overBudget: 0, onTrack: 0 }
      }

      // Get budgets for current month (active ones: no end_date OR end_date >= current month)
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*, categories(id)')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .or(`end_date.is.null,end_date.gte.${currentMonth}`)

      // Get expenses by category for current month
      const { data: expenses } = await supabase
        .from('transactions')
        .select('amount, category_id, project_id')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate)
        .not('category_id', 'is', null)

      const expensesByCategory = expenses?.reduce((acc: any, t: any) => {
        if (!acc[t.category_id]) acc[t.category_id] = 0
        acc[t.category_id] += Number(t.amount)
        return acc
      }, {})

      const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.amount), 0) || 0
      
      let overBudget = 0
      let onTrack = 0
      
      budgets?.forEach(budget => {
        // Si el presupuesto es por proyecto, sumar solo los gastos del proyecto.
        // Si no, sumar por categoría en todos los proyectos.
        const spent = (expenses || [])
          .filter(t => t.category_id === budget.category_id)
          .filter(t => {
            if (budget.project_id) return t.project_id === budget.project_id
            return true
          })
          .reduce((sum, t) => sum + Number(t.amount), 0)

        const total = Number(budget.amount)
        const percentage = total > 0 ? (spent / total) * 100 : 0
        if (percentage >= 100) overBudget++
        else if (percentage < 80) onTrack++
      })

      return {
        totalBudget,
        totalBudgets: budgets?.length || 0,
        overBudget,
        onTrack,
      }
    },
    enabled: !!userId,
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Presupuesto Total
          </CardTitle>
          <div className="p-2 rounded-lg bg-blue-50">
            <Target className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(stats?.totalBudget || 0)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Categorías
          </CardTitle>
          <div className="p-2 rounded-lg bg-purple-50">
            <Target className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats?.totalBudgets || 0}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Excedidos
          </CardTitle>
          <div className="p-2 rounded-lg bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats?.overBudget || 0}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            En Regla
          </CardTitle>
          <div className="p-2 rounded-lg bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats?.onTrack || 0}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
