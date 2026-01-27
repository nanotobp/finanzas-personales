'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { TrendingDown } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export function CashFlowWaterfall() {
  const supabase = createClient()
  const { userId } = useAuth()

  const { data: cashFlowData = [] } = useQuery({
    queryKey: ['cash-flow-waterfall'],
    queryFn: async () => {
      if (!userId) return []

      // Último mes
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 1)
      startDate.setDate(1)
      
      const endDate = new Date()
      endDate.setDate(0) // Último día del mes anterior

      const [transactionsResult, invoicesResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('type, amount, categories(name)')
          .eq('user_id', userId)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]),
        supabase
          .from('invoices')
          .select('amount')
          .eq('user_id', userId)
          .eq('status', 'paid')
          .gte('paid_date', startDate.toISOString().split('T')[0])
          .lte('paid_date', endDate.toISOString().split('T')[0])
      ])

      if (transactionsResult.error) throw transactionsResult.error
      const data = transactionsResult.data || []
      const invoices = invoicesResult.data || []

      const transactionIncome = data
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      
      const invoiceIncome = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
      const income = transactionIncome + invoiceIncome

      const expensesByCategory: Record<string, number> = {}
      data
        .filter(t => t.type === 'expense')
        .forEach(t => {
          const category = (t.categories as any)?.name || 'Sin categoría'
          if (!expensesByCategory[category]) {
            expensesByCategory[category] = 0
          }
          expensesByCategory[category] += Number(t.amount)
        })

      // Top 5 categorías de gasto
      const topCategories = Object.entries(expensesByCategory)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([name, amount]) => ({ name, amount }))

      const otherExpenses = Object.values(expensesByCategory)
        .reduce((sum: number, val: any) => sum + val, 0) - 
        topCategories.reduce((sum, cat: any) => sum + cat.amount, 0)

      const totalExpenses = Object.values(expensesByCategory)
        .reduce((sum: number, val: any) => sum + val, 0)

      const finalBalance = income - totalExpenses

      // Construir datos waterfall
      let cumulative = 0
      const waterfallData: any[] = [
        { name: 'Ingresos', value: income, cumulative: 0, end: income, isPositive: true }
      ]

      cumulative = income

      topCategories.forEach((cat: any) => {
        const start = cumulative
        cumulative -= cat.amount
        waterfallData.push({
          name: cat.name,
          value: -cat.amount,
          cumulative: cumulative,
          start: start,
          isPositive: false
        })
      })

      if (otherExpenses > 0) {
        const start = cumulative
        cumulative -= otherExpenses
        waterfallData.push({
          name: 'Otros Gastos',
          value: -otherExpenses,
          cumulative: cumulative,
          start: start,
          isPositive: false
        })
      }

      waterfallData.push({
        name: 'Balance Final',
        value: finalBalance,
        cumulative: 0,
        end: finalBalance,
        isPositive: finalBalance >= 0
      })

      return waterfallData
    },
    enabled: !!userId,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Waterfall de Cash Flow
        </CardTitle>
        <CardDescription>
          Mes anterior - Desglose de flujo de caja
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `Gs. ${Math.round(value).toLocaleString('es-PY')}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">{data.name}</p>
                      <p className={`text-sm ${data.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {data.isPositive ? '+' : ''}Gs {Math.abs(data.value).toLocaleString()}
                      </p>
                      {data.end !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Total: Gs {data.end.toLocaleString()}
                        </p>
                      )}
                      {data.cumulative !== undefined && data.end === undefined && (
                        <p className="text-xs text-muted-foreground">
                          Acumulado: Gs {data.cumulative.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {cashFlowData.map((entry: any, index: number) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isPositive ? '#22c55e' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="text-lg font-bold text-green-600">
              Gs. {Math.round(cashFlowData[0]?.value || 0).toLocaleString('es-PY')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Gastos</p>
            <p className="text-lg font-bold text-red-600">
              Gs. {Math.round(Math.abs(cashFlowData.slice(1, -1).reduce((sum: number, d: any) => sum + d.value, 0))).toLocaleString('es-PY')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className={`text-lg font-bold ${(cashFlowData[cashFlowData.length - 1]?.value || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Gs. {Math.round(cashFlowData[cashFlowData.length - 1]?.value || 0).toLocaleString('es-PY')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
