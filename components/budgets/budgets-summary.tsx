'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Target, AlertTriangle, CheckCircle } from 'lucide-react'

export function BudgetsSummary() {
  const supabase = createClient()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: stats } = useQuery({
    queryKey: ['budgets-summary', currentMonth],
    queryFn: async () => {
      const startDate = `${currentMonth}-01`
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
        .toISOString().split('T')[0]

      // Get budgets for current month
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*, categories(id)')
        .eq('month', currentMonth)

      // Get expenses by category for current month
      const { data: expenses } = await supabase
        .from('transactions')
        .select('amount, category_id')
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
        const spent = expensesByCategory?.[budget.category_id] || 0
        const percentage = (spent / Number(budget.amount)) * 100
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
