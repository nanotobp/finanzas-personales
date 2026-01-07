'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

export function EmergencyFundCoverage() {
  const supabase = createClient()

  const { data: coverageData } = useQuery({
    queryKey: ['emergency-fund-coverage'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // Obtener balance total de cuentas
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', user.id)

      if (accountsError) throw accountsError

      const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)

      // Calcular gastos mensuales promedio (últimos 3 meses)
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', threeMonthsAgo.toISOString().split('T')[0])

      if (transactionsError) throw transactionsError

      const totalExpenses = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
      const monthlyExpenses = totalExpenses / 3

      const monthsCovered = monthlyExpenses > 0 ? totalBalance / monthlyExpenses : 0
      const targetMonths = 6 // Meta: 6 meses de gastos
      const percentage = Math.min((monthsCovered / targetMonths) * 100, 100)

      return {
        totalBalance,
        monthlyExpenses,
        monthsCovered,
        targetMonths,
        percentage
      }
    }
  })

  const months = coverageData?.monthsCovered || 0
  const percentage = coverageData?.percentage || 0

  const getStatus = () => {
    if (months >= 6) return { color: 'text-green-600', bg: 'bg-green-100', message: '¡Excelente! Fondo completo' }
    if (months >= 3) return { color: 'text-blue-600', bg: 'bg-blue-100', message: 'Buen progreso' }
    if (months >= 1) return { color: 'text-yellow-600', bg: 'bg-yellow-100', message: 'En construcción' }
    return { color: 'text-red-600', bg: 'bg-red-100', message: 'Crítico, prioriza ahorro' }
  }

  const status = getStatus()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Fondo de Emergencia
        </CardTitle>
        <CardDescription>Cobertura de gastos mensuales</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main metric */}
          <div className="text-center">
            <div className={cn('text-5xl font-bold', status.color)}>
              {months.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              meses cubiertos
            </div>
            <div className={cn('text-xs mt-2 px-3 py-1 rounded-full inline-block', status.bg, status.color)}>
              {status.message}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 meses</span>
              <span>Meta: 6 meses</span>
            </div>
            <Progress value={percentage} className="h-3" />
            <div className="text-center text-xs text-muted-foreground">
              {percentage.toFixed(0)}% completado
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Balance Total</p>
              <p className="text-sm font-semibold">
                Gs. {Math.round(coverageData?.totalBalance || 0).toLocaleString('es-PY')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gasto Mensual</p>
              <p className="text-sm font-semibold">
                Gs. {Math.round(coverageData?.monthlyExpenses || 0).toLocaleString('es-PY')}
              </p>
            </div>
          </div>

          {/* Recommendation */}
          {months < 6 && (
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
              💡 Necesitas ahorrar <strong>Gs. {Math.round((6 - months) * (coverageData?.monthlyExpenses || 0)).toLocaleString('es-PY')}</strong> adicionales para completar tu fondo de emergencia.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
