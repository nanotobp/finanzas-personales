'use client'

import { lazy, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const ReactECharts = lazy(() => import('echarts-for-react'))

export function IncomeExpensesChart() {
  const supabase = createClient()

  const { data, isLoading } = useQuery({
    queryKey: ['income-expenses-chart'],
    queryFn: async () => {
      const now = new Date()
      const tenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 9, 1)

      const [{ data: transactions }, { data: invoices }] = await Promise.all([
        supabase
          .from('transactions')
          .select('type, amount, date')
          .gte('date', tenMonthsAgo.toISOString().split('T')[0])
          .order('date'),
        supabase
          .from('invoices')
          .select('amount, paid_date')
          .eq('status', 'paid')
          .not('paid_date', 'is', null)
          .gte('paid_date', tenMonthsAgo.toISOString().split('T')[0])
      ])

      // Agrupar por mes
      const monthlyData: Record<string, { income: number; expenses: number }> = {}
      
      transactions?.forEach(t => {
        const date = new Date(t.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 }
        }

        if (t.type === 'income') {
          monthlyData[monthKey].income += Number(t.amount)
        } else if (t.type === 'expense') {
          monthlyData[monthKey].expenses += Number(t.amount)
        }
      })

      // Agregar facturas pagadas
      invoices?.forEach(invoice => {
        const date = new Date(invoice.paid_date!)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 }
        }
        
        monthlyData[monthKey].income += Number(invoice.amount)
      })

      // Convertir a array y ordenar
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      return Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-10)
        .map(([key, values]) => {
          const [year, month] = key.split('-')
          return {
            month: monthNames[parseInt(month) - 1],
            income: values.income,
            expenses: values.expenses
          }
        })
    },
  })

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#ccc',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      valueFormatter: (value: number) => `Gs. ${Math.round(value).toLocaleString('es-PY')}`
    },
    legend: {
      data: ['Ingresos', 'Gastos'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data?.map(d => d.month) || [],
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      axisLabel: {
        color: '#6b7280'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#6b7280',
        formatter: (value: number) => `Gs. ${Math.round(value).toLocaleString('es-PY')}`
      },
      splitLine: {
        lineStyle: {
          color: '#e5e7eb',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: 'Ingresos',
        type: 'bar',
        data: data?.map(d => d.income) || [],
        itemStyle: {
          color: '#16A249',
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: 12
      },
      {
        name: 'Gastos',
        type: 'bar',
        data: data?.map(d => d.expenses) || [],
        itemStyle: {
          color: '#e5e7eb',
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: 12
      }
    ]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos vs Gastos</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[350px] w-full">
            <Skeleton className="h-full w-full" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        ) : (
          <div className="h-[350px] w-full">
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
            </Suspense>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
