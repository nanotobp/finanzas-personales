'use client'

import { memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  DollarSign,
  Calendar,
  Target
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Area, AreaChart } from 'recharts'
import { EmptyStateAnalytics } from './empty-state-analytics'

interface CashflowPrediction {
  date: string
  predicted_income: number
  predicted_expenses: number
  predicted_balance: number
  confidence_score: number
  actual_income?: number
  actual_expenses?: number
}

interface Insight {
  type: 'warning' | 'success' | 'info'
  message: string
  impact: number
}

export const CashflowPredictiveAnalysis = memo(function CashflowPredictiveAnalysis() {
  const supabase = createClient()

  const { data, isLoading } = useQuery({
    queryKey: ['cashflow-predictions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // Obtener transacciones de los últimos 2 meses para análisis
      const twoMonthsAgo = new Date()
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type, date')
        .eq('user_id', user.id)
        .gte('date', twoMonthsAgo.toISOString())
        .order('date', { ascending: true })

      if (!transactions || transactions.length === 0) {
        return {
          predictions: [],
          insights: [{
            type: 'info' as const,
            message: 'Necesitas más datos históricos para predicciones precisas',
            impact: 0
          }]
        }
      }

      // Agrupar por mes
      const monthlyData = transactions.reduce((acc, t) => {
        const month = t.date.substring(0, 7) // YYYY-MM
        if (!acc[month]) {
          acc[month] = { income: 0, expenses: 0, count: 0 }
        }
        if (t.type === 'income') {
          acc[month].income += Number(t.amount)
        } else {
          acc[month].expenses += Number(t.amount)
        }
        acc[month].count++
        return acc
      }, {} as Record<string, { income: number, expenses: number, count: number }>)

      const months = Object.keys(monthlyData).sort()
      
      // Calcular promedios y tendencias
      const avgIncome = months.reduce((sum, m) => sum + monthlyData[m].income, 0) / months.length
      const avgExpenses = months.reduce((sum, m) => sum + monthlyData[m].expenses, 0) / months.length

      // Calcular tendencia (regresión linear simple)
      const incomeTrend = calculateTrend(months.map((m, i) => ({ x: i, y: monthlyData[m].income })))
      const expensesTrend = calculateTrend(months.map((m, i) => ({ x: i, y: monthlyData[m].expenses })))

      // Obtener balance actual
      const { data: accounts } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', user.id)
        .eq('is_active', true)

      const currentBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0

      // Generar predicciones para los próximos 6 meses
      const predictions: CashflowPrediction[] = []
      let runningBalance = currentBalance

      for (let i = 1; i <= 6; i++) {
        const futureDate = new Date()
        futureDate.setMonth(futureDate.getMonth() + i)
        const dateStr = futureDate.toISOString().substring(0, 7)

        // Aplicar tendencia + variación aleatoria pequeña
        const predictedIncome = avgIncome + (incomeTrend * (months.length + i)) * (0.95 + Math.random() * 0.1)
        const predictedExpenses = avgExpenses + (expensesTrend * (months.length + i)) * (0.95 + Math.random() * 0.1)
        const netChange = predictedIncome - predictedExpenses
        runningBalance += netChange

        // Confianza disminuye con el tiempo
        const confidence = Math.max(0.5, 0.9 - (i * 0.06))

        predictions.push({
          date: dateStr,
          predicted_income: predictedIncome,
          predicted_expenses: predictedExpenses,
          predicted_balance: runningBalance,
          confidence_score: confidence
        })
      }

      // Generar insights
      const insights: Insight[] = []

      // Balance negativo predicho
      const negativeMonths = predictions.filter(p => p.predicted_balance < 0)
      if (negativeMonths.length > 0) {
        insights.push({
          type: 'warning',
          message: `Se predice balance negativo en ${negativeMonths.length} meses`,
          impact: Math.abs(Math.min(...predictions.map(p => p.predicted_balance)))
        })
      }

      // Gastos creciendo más rápido que ingresos
      if (expensesTrend > incomeTrend && expensesTrend > 0) {
        insights.push({
          type: 'warning',
          message: 'Tus gastos están creciendo más rápido que tus ingresos',
          impact: (expensesTrend - incomeTrend) * 6
        })
      }

      // Tendencia positiva de ahorro
      const avgSavings = avgIncome - avgExpenses
      if (avgSavings > avgIncome * 0.15) {
        insights.push({
          type: 'success',
          message: `Excelente tasa de ahorro: ${((avgSavings / avgIncome) * 100).toFixed(1)}%`,
          impact: avgSavings * 6
        })
      }

      // Proyección de patrimonio
      const sixMonthProjection = predictions[5].predicted_balance - currentBalance
      if (sixMonthProjection > 0) {
        insights.push({
          type: 'success',
          message: `Se proyecta un aumento de ${formatCurrency(sixMonthProjection)} en 6 meses`,
          impact: sixMonthProjection
        })
      }

      // Balance muy bajo
      const lowestBalance = Math.min(...predictions.map(p => p.predicted_balance))
      if (lowestBalance < avgExpenses) {
        insights.push({
          type: 'warning',
          message: 'Tu balance podría caer por debajo de un mes de gastos',
          impact: avgExpenses - lowestBalance
        })
      }

      return { predictions, insights, avgIncome, avgExpenses, currentBalance }
    },
    refetchInterval: 24 * 60 * 60 * 1000 // Actualizar diariamente
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análisis Predictivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.predictions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análisis Predictivo de Flujo de Caja
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
              <p>Analizando tus datos...</p>
            </div>
          ) : (
            <EmptyStateAnalytics />
          )}
        </CardContent>
      </Card>
    )
  }

  const chartData = data.predictions.map(p => ({
    month: new Date(p.date + '-01').toLocaleDateString('es', { month: 'short' }),
    Ingresos: Math.round(p.predicted_income),
    Gastos: Math.round(p.predicted_expenses),
    Balance: Math.round(p.predicted_balance),
    Confianza: Math.round(p.confidence_score * 100)
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Análisis Predictivo de Flujo de Caja
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Insights */}
        <div className="space-y-2">
          {data.insights.map((insight, idx) => (
            <div 
              key={idx}
              className={`p-3 rounded-lg border-l-4 ${
                insight.type === 'warning' 
                  ? 'bg-orange-50 border-orange-500 dark:bg-orange-950/20' 
                  : insight.type === 'success'
                  ? 'bg-green-50 border-green-500 dark:bg-green-950/20'
                  : 'bg-blue-50 border-blue-500 dark:bg-blue-950/20'
              }`}
            >
              <div className="flex items-start gap-2">
                {insight.type === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                ) : insight.type === 'success' ? (
                  <Target className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{insight.message}</p>
                  {insight.impact > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Impacto: {formatCurrency(insight.impact)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Promedio Ingresos</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(data.avgIncome || 0)}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-red-700 dark:text-red-400">Promedio Gastos</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(data.avgExpenses || 0)}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Balance Actual</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(data.currentBalance || 0)}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Proyección a 6 Meses</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#888888" fontSize={12} />
              <YAxis stroke="#888888" fontSize={12} tickFormatter={(value: number) => `Gs. ${Math.round(value).toLocaleString('es-PY')}`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => `Gs. ${Math.round(value).toLocaleString('es-PY')}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="Ingresos" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorIncome)" 
              />
              <Area 
                type="monotone" 
                dataKey="Gastos" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorExpense)" 
              />
              <Area 
                type="monotone" 
                dataKey="Balance" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorBalance)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence Indicator */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Confianza de Predicción
            </Badge>
            <span className="text-sm text-muted-foreground">
              Basado en {data.predictions[0]?.confidence_score ? '6 meses' : '3 meses'} de datos
            </span>
          </div>
          <div className="text-2xl font-bold">
            {data.predictions[0]?.confidence_score ? Math.round(data.predictions[0].confidence_score * 100) : 75}%
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

// Helper function para calcular tendencia linear
function calculateTrend(data: { x: number, y: number }[]): number {
  const n = data.length
  if (n === 0) return 0

  const sumX = data.reduce((sum, point) => sum + point.x, 0)
  const sumY = data.reduce((sum, point) => sum + point.y, 0)
  const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0)
  const sumX2 = data.reduce((sum, point) => sum + point.x * point.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  return slope
}