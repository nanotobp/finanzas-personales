'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  TrendingDown, 
  Target, 
  Calendar,
  DollarSign,
  Clock
} from 'lucide-react'

interface SmartAlert {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  category: 'budget' | 'goal' | 'cashflow' | 'opportunity'
  title: string
  description: string
  actionRequired: boolean
  daysUntilCritical?: number
  amount?: number
  percentage?: number
}

export function SmartAlerts() {
  const supabase = createClient()

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['smart-alerts'],
    queryFn: async (): Promise<SmartAlert[]> => {
      const alerts: SmartAlert[] = []
      
      // 1. Alertas de presupuesto excedido
      const { data: budgets } = await supabase
        .from('budgets')
        .select(`
          *,
          categories (name)
        `)
        .gte('amount', 1)

      if (budgets) {
        for (const budget of budgets) {
          const spent = budget.spent || 0
          const percentage = (spent / budget.amount) * 100
          
          if (percentage > 100) {
            alerts.push({
              id: `budget-${budget.id}`,
              type: 'critical',
              category: 'budget',
              title: 'Presupuesto Excedido',
              description: `Has gastado ${percentage.toFixed(1)}% del presupuesto de ${budget.categories?.name}`,
              actionRequired: true,
              percentage,
              amount: spent
            })
          } else if (percentage > 85) {
            alerts.push({
              id: `budget-warning-${budget.id}`,
              type: 'warning',
              category: 'budget',
              title: 'Presupuesto Casi Agotado',
              description: `Has gastado ${percentage.toFixed(1)}% del presupuesto de ${budget.categories?.name}`,
              actionRequired: false,
              percentage,
              amount: spent
            })
          }
        }
      }

      // 2. Alertas de objetivos de ahorro en riesgo
      const { data: goals } = await supabase
        .from('savings_goals')
        .select('*')
        .not('target_date', 'is', null)

      if (goals) {
        const today = new Date()
        
        for (const goal of goals) {
          const targetDate = new Date(goal.target_date)
          const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
          const progress = (goal.current_amount / goal.target_amount) * 100
          const remaining = goal.target_amount - goal.current_amount
          
          if (daysLeft > 0) {
            const requiredMonthlyAmount = remaining / (daysLeft / 30)
            
            // Obtener ahorro promedio mensual de los últimos 3 meses
            const { data: recentSavings } = await supabase
              .from('transactions')
              .select('amount')
              .eq('type', 'income')
              .gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
            
            const avgMonthlySavings = recentSavings ? 
              (recentSavings.reduce((sum, t) => sum + Number(t.amount), 0) * 0.2) / 3 : 0
            
            if (requiredMonthlyAmount > avgMonthlySavings * 1.5) {
              alerts.push({
                id: `goal-${goal.id}`,
                type: daysLeft < 90 ? 'critical' : 'warning',
                category: 'goal',
                title: 'Objetivo de Ahorro en Riesgo',
                description: `Para alcanzar "${goal.name}" necesitas ahorrar Gs. ${Math.round(requiredMonthlyAmount).toLocaleString('es-PY')} mensualmente`,
                actionRequired: true,
                daysUntilCritical: daysLeft,
                amount: requiredMonthlyAmount
              })
            }
          }
        }
      }

      // 3. Alertas de flujo de caja
      const { data: upcomingExpenses } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('is_active', true)

      if (upcomingExpenses) {
        const { data: accounts } = await supabase
          .from('accounts')
          .select('balance')
        
        const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0
        const monthlyRecurring = upcomingExpenses.reduce((sum, sub) => {
          const amount = Number(sub.amount)
          switch (sub.frequency) {
            case 'monthly': return sum + amount
            case 'yearly': return sum + (amount / 12)
            case 'weekly': return sum + (amount * 4.33)
            default: return sum
          }
        }, 0)

        if (totalBalance < monthlyRecurring * 2) {
          alerts.push({
            id: 'cashflow-warning',
            type: 'warning',
            category: 'cashflow',
            title: 'Advertencia de Flujo de Caja',
            description: `Tu saldo actual solo cubre ${(totalBalance / monthlyRecurring).toFixed(1)} meses de gastos recurrentes`,
            actionRequired: true,
            amount: monthlyRecurring * 3 - totalBalance
          })
        }
      }

      // 4. Oportunidades de ahorro
      const { data: expenses } = await supabase
        .from('transactions')
        .select(`
          amount,
          categories (name)
        `)
        .eq('type', 'expense')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (expenses) {
        const categoryTotals = expenses.reduce((acc, expense) => {
          const category = (expense.categories as any)?.name || 'Sin categoría'
          acc[category] = (acc[category] || 0) + Number(expense.amount)
          return acc
        }, {} as Record<string, number>)

        const highestCategory = Object.entries(categoryTotals)
          .sort(([,a], [,b]) => b - a)[0]

        if (highestCategory && highestCategory[1] > 500000) { // > 500k
          alerts.push({
            id: 'opportunity-saving',
            type: 'info',
            category: 'opportunity',
            title: 'Oportunidad de Ahorro',
            description: `Tu mayor gasto este mes fue en ${highestCategory[0]} (Gs. ${Math.round(highestCategory[1]).toLocaleString('es-PY')}). ¿Podrías reducirlo un 10%?`,
            actionRequired: false,
            amount: highestCategory[1] * 0.1
          })
        }
      }

      return alerts.sort((a, b) => {
        const priority = { 'critical': 4, 'warning': 3, 'info': 2, 'success': 1 }
        return priority[b.type] - priority[a.type]
      })
    },
    refetchInterval: 5 * 60 * 1000 // Refrescar cada 5 minutos
  })

  const getAlertIcon = (type: SmartAlert['type']) => {
    switch (type) {
      case 'critical': return AlertTriangle
      case 'warning': return TrendingDown
      case 'info': return Target
      case 'success': return Target
    }
  }

  const getAlertColor = (type: SmartAlert['type']) => {
    switch (type) {
      case 'critical': return 'destructive'
      case 'warning': return 'default'
      case 'info': return 'secondary'
      case 'success': return 'default'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas Inteligentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alertas Inteligentes
          {alerts && alerts.length > 0 && (
            <Badge variant="destructive">{alerts.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!alerts || alerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>¡Todo se ve bien! No hay alertas críticas.</p>
          </div>
        ) : (
          alerts.slice(0, 5).map((alert) => {
            const Icon = getAlertIcon(alert.type)
            return (
              <Alert key={alert.id} className="border-l-4 border-l-current">
                <Icon className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">{alert.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {alert.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getAlertColor(alert.type)} className="text-xs">
                          {alert.category}
                        </Badge>
                        {alert.actionRequired && (
                          <Badge variant="outline" className="text-xs">
                            Acción requerida
                          </Badge>
                        )}
                        {alert.daysUntilCritical && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {alert.daysUntilCritical} días
                          </div>
                        )}
                      </div>
                    </div>
                    {alert.amount && (
                      <div className="text-right text-sm font-mono">
                        Gs. {Math.round(alert.amount).toLocaleString('es-PY')}
                      </div>
                    )}
                    {alert.percentage && (
                      <div className="text-right text-sm font-bold">
                        {alert.percentage.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}