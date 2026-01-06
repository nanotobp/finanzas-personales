'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Scale } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

export function DebtToIncomeRatio() {
  const supabase = createClient()

  const { data: dtiData } = useQuery({
    queryKey: ['debt-to-income-ratio'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // Calcular ingreso mensual promedio (últimos 3 meses)
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      const { data: incomeTransactions, error: incomeError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'income')
        .gte('date', threeMonthsAgo.toISOString().split('T')[0])

      if (incomeError) throw incomeError

      const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
      const monthlyIncome = totalIncome / 3

      // Calcular pagos de deuda mensuales (suscripciones + tarjetas)
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (subsError) throw subsError

      const monthlyDebtPayments = subscriptions.reduce((sum, s) => sum + Number(s.amount), 0)

      // También incluir gastos recurrentes en categorías de deuda
      const { data: debtExpenses, error: debtError } = await supabase
        .from('transactions')
        .select('amount, categories(name)')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', threeMonthsAgo.toISOString().split('T')[0])

      if (debtError) throw debtError

      const debtCategories = ['préstamo', 'crédito', 'deuda', 'tarjeta']
      const additionalDebt = debtExpenses
        .filter(t => t.categories && debtCategories.some(cat => 
          t.categories.name.toLowerCase().includes(cat)
        ))
        .reduce((sum, t) => sum + Number(t.amount), 0) / 3

      const totalMonthlyDebt = monthlyDebtPayments + additionalDebt
      const dtiRatio = monthlyIncome > 0 ? (totalMonthlyDebt / monthlyIncome) * 100 : 0

      return {
        monthlyIncome,
        monthlyDebtPayments: totalMonthlyDebt,
        dtiRatio: Math.min(dtiRatio, 100),
        availableIncome: monthlyIncome - totalMonthlyDebt
      }
    }
  })

  const ratio = dtiData?.dtiRatio || 0

  const getStatus = () => {
    if (ratio <= 20) return { 
      color: 'text-green-600', 
      bg: 'bg-green-100', 
      message: '¡Excelente! Deuda muy saludable',
      level: 'Excelente'
    }
    if (ratio <= 36) return { 
      color: 'text-blue-600', 
      bg: 'bg-blue-100', 
      message: 'Buen nivel de deuda',
      level: 'Bueno'
    }
    if (ratio <= 43) return { 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-100', 
      message: 'Deuda moderada, vigila',
      level: 'Moderado'
    }
    if (ratio <= 50) return { 
      color: 'text-orange-600', 
      bg: 'bg-orange-100', 
      message: 'Deuda alta, reduce gastos',
      level: 'Alto'
    }
    return { 
      color: 'text-red-600', 
      bg: 'bg-red-100', 
      message: 'Crítico, busca asesoría',
      level: 'Crítico'
    }
  }

  const status = getStatus()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Relación Deuda-Ingreso
        </CardTitle>
        <CardDescription>Debt-to-Income Ratio (DTI)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main metric */}
          <div className="text-center">
            <div className={cn('text-5xl font-bold', status.color)}>
              {ratio.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              de tus ingresos van a deudas
            </div>
            <div className={cn('text-xs mt-2 px-3 py-1 rounded-full inline-block', status.bg, status.color)}>
              {status.message}
            </div>
          </div>

          {/* Progress bar with zones */}
          <div className="space-y-2">
            <Progress 
              value={ratio} 
              className={cn(
                'h-3',
                ratio <= 20 && '[&>div]:bg-green-500',
                ratio > 20 && ratio <= 36 && '[&>div]:bg-blue-500',
                ratio > 36 && ratio <= 43 && '[&>div]:bg-yellow-500',
                ratio > 43 && ratio <= 50 && '[&>div]:bg-orange-500',
                ratio > 50 && '[&>div]:bg-red-500'
              )}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0%</span>
              <span>20%</span>
              <span>36%</span>
              <span>43%</span>
              <span>50%+</span>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Ingreso Mensual</span>
              <span className="text-sm font-semibold text-green-600">
                Gs {((dtiData?.monthlyIncome || 0) / 1000).toFixed(0)}k
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Pagos de Deuda</span>
              <span className="text-sm font-semibold text-red-600">
                Gs {((dtiData?.monthlyDebtPayments || 0) / 1000).toFixed(0)}k
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-xs text-muted-foreground">Disponible</span>
              <span className={cn('text-sm font-semibold', status.color)}>
                Gs {((dtiData?.availableIncome || 0) / 1000).toFixed(0)}k
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <strong>Referencia:</strong> Un DTI bajo 36% se considera saludable. Por encima de 43% puede dificultar obtener nuevos créditos.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
