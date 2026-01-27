'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Flame, TrendingDown, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '@/hooks/use-auth'

export function BurnRate() {
  const supabase = createClient()
  const { userId } = useAuth()

  const { data: burnRateData } = useQuery({
    queryKey: ['burn-rate'],
    queryFn: async () => {
      if (!userId) return null

      // Últimos 6 meses
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const [transactionsResult, invoicesResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('date, type, amount')
          .eq('user_id', userId)
          .gte('date', sixMonthsAgo.toISOString().split('T')[0]),
        supabase
          .from('invoices')
          .select('paid_date, amount')
          .eq('user_id', userId)
          .eq('status', 'paid')
          .not('paid_date', 'is', null)
      ])

      if (transactionsResult.error) throw transactionsResult.error
      const transactions = transactionsResult.data || []
      const invoices = invoicesResult.data || []

      // Agrupar por mes
      const monthlyData: any = {}
      
      transactions.forEach(t => {
        const month = t.date.substring(0, 7) // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { income: 0, expenses: 0 }
        }
        if (t.type === 'income') {
          monthlyData[month].income += Number(t.amount)
        } else {
          monthlyData[month].expenses += Number(t.amount)
        }
      })

      // Agregar ingresos de facturas pagadas
      invoices.forEach(inv => {
        const month = inv.paid_date!.substring(0, 7) // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { income: 0, expenses: 0 }
        }
        monthlyData[month].income += Number(inv.amount)
      })

      // Convertir a array y calcular burn rate
      const monthlyArray = Object.entries(monthlyData)
        .map(([month, data]: any) => ({
          month,
          income: data.income,
          expenses: data.expenses,
          burnRate: data.expenses,
          netCashFlow: data.income - data.expenses
        }))
        .sort((a, b) => a.month.localeCompare(b.month))

      // Calcular promedio
      const avgBurnRate = monthlyArray.reduce((sum, m) => sum + m.burnRate, 0) / monthlyArray.length
      const avgIncome = monthlyArray.reduce((sum, m) => sum + m.income, 0) / monthlyArray.length
      const avgNetCashFlow = avgIncome - avgBurnRate

      // Obtener balance actual
      const { data: accounts } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', userId)

      const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0

      // Calcular runway (meses hasta que se acabe el dinero)
      const runway = avgNetCashFlow >= 0 ? Infinity : totalBalance / avgBurnRate

      return {
        monthlyData: monthlyArray,
        avgBurnRate,
        avgIncome,
        avgNetCashFlow,
        totalBalance,
        runway
      }
    },
    enabled: !!userId,
  })

  const isHealthy = (burnRateData?.avgNetCashFlow || 0) >= 0
  const runway = burnRateData?.runway || 0

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Burn Rate Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Burn Rate
          </CardTitle>
          <CardDescription>
            Tasa de gasto mensual promedio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Main Metric */}
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600">
                Gs. {Math.round(burnRateData?.avgBurnRate || 0).toLocaleString('es-PY')}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                por mes
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Ingreso Promedio</p>
                <p className="text-lg font-semibold text-green-600">
                  Gs. {Math.round(burnRateData?.avgIncome || 0).toLocaleString('es-PY')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cash Flow Neto</p>
                <p className={cn(
                  'text-lg font-semibold',
                  isHealthy ? 'text-green-600' : 'text-red-600'
                )}>
                  {isHealthy ? '+' : ''}Gs. {Math.round(burnRateData?.avgNetCashFlow || 0).toLocaleString('es-PY')}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className={cn(
              'p-3 rounded-lg text-sm',
              isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            )}>
              {isHealthy ? (
                <>
                  <strong>✓ Saludable:</strong> Tus ingresos superan tus gastos. Estás acumulando capital.
                </>
              ) : (
                <>
                  <strong>⚠ Atención:</strong> Estás gastando más de lo que ganas. Revisa tus gastos.
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Runway Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Runway (Pista)
          </CardTitle>
          <CardDescription>
            Meses de cobertura con balance actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Main Metric */}
            <div className="text-center">
              {runway === Infinity ? (
                <>
                  <div className="text-4xl font-bold text-green-600">∞</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Cash flow positivo
                  </div>
                </>
              ) : (
                <>
                  <div className={cn(
                    'text-4xl font-bold',
                    runway > 6 ? 'text-green-600' : runway > 3 ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {runway.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    meses restantes
                  </div>
                </>
              )}
            </div>

            {/* Balance */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">Balance Total</p>
              <p className="text-2xl font-bold">
                Gs. {Math.round(burnRateData?.totalBalance || 0).toLocaleString('es-PY')}
              </p>
            </div>

            {/* Warning or Success */}
            {runway !== Infinity && (
              <div className={cn(
                'p-3 rounded-lg text-sm',
                runway > 6 ? 'bg-green-100 text-green-800' :
                runway > 3 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              )}>
                {runway > 6 ? (
                  <>
                    <strong>✓ Bien:</strong> Tienes más de 6 meses de runway. Posición sólida.
                  </>
                ) : runway > 3 ? (
                  <>
                    <strong>⚠ Precaución:</strong> Considera aumentar ingresos o reducir gastos.
                  </>
                ) : (
                  <>
                    <strong>🚨 Urgente:</strong> Runway crítico. Actúa ahora para mejorar tu situación.
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Tendencia de Cash Flow
          </CardTitle>
          <CardDescription>
            Últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={burnRateData?.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => {
                  const [year, month] = value.split('-')
                  return `${month}/${year.slice(2)}`
                }}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `Gs. ${Math.round(value).toLocaleString('es-PY')}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{data.month}</p>
                        <p className="text-sm text-green-600">
                          Ingresos: Gs {data.income.toLocaleString()}
                        </p>
                        <p className="text-sm text-red-600">
                          Gastos: Gs {data.expenses.toLocaleString()}
                        </p>
                        <p className={`text-sm font-semibold ${data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Neto: {data.netCashFlow >= 0 ? '+' : ''}Gs {data.netCashFlow.toLocaleString()}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#22c55e" 
                strokeWidth={2}
                name="Ingresos"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Gastos"
              />
              <Line 
                type="monotone" 
                dataKey="netCashFlow" 
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Neto"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
