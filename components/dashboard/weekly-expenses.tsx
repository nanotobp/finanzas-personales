'use client'

import { lazy, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'

const ReactECharts = lazy(() => import('echarts-for-react'))

export function WeeklyExpenses() {
  const supabase = createClient()
  const { userId } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['weekly-expenses'],
    queryFn: async () => {
      if (!userId) return { data: [], categories: [] }

      const now = new Date()
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

      const [transactionsRes, categoriesRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('category_id, amount, date')
          .eq('user_id', userId)
          .eq('type', 'expense')
          .gte('date', twelveMonthsAgo.toISOString().split('T')[0])
          .order('date'),
        supabase
          .from('categories')
          .select('id, name')
          .eq('user_id', userId)
          .eq('type', 'expense')
          .limit(3)
      ])

      const transactions = transactionsRes.data || []
      const categories = categoriesRes.data || []

      if (transactions.length === 0) return { data: [], categories: [] }

      // Agrupar por mes y categoría
      const monthlyData: Record<string, Record<string, number>> = {}
      
      transactions.forEach(t => {
        const date = new Date(t.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {}
        }

        const catId = t.category_id || 'sin-categoria'
        monthlyData[monthKey][catId] = (monthlyData[monthKey][catId] || 0) + Number(t.amount)
      })

      // Convertir a array
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      const chartData = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([key, values]) => {
          const [year, month] = key.split('-')
          const result: any = { month: monthNames[parseInt(month) - 1] }
          categories.forEach((cat, idx) => {
            result[`cat${idx + 1}`] = values[cat.id] || 0
          })
          return result
        })

      return { data: chartData, categories }
    },
    enabled: !!userId,
  })

  const categoryColors = ['#DC2626', '#2563EB', '#16A34A', '#F59E0B', '#7C3AED', '#06B6D4']
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      valueFormatter: (value: any) => {
        const num = Number(value)
        if (Number.isNaN(num)) return String(value)
        return `Gs. ${num.toLocaleString('es-PY')}`
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#ccc',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      }
    },
    legend: {
      data: data?.categories.map(c => c.name) || [],
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
      data: data?.data.map(d => d.month) || [],
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
        formatter: (value: any) => {
          const num = Number(value)
          if (Number.isNaN(num)) return String(value)
          return `Gs. ${num.toLocaleString('es-PY')}`
        }
      },
      splitLine: {
        lineStyle: {
          color: '#e5e7eb',
          type: 'dashed'
        }
      }
    },
    series: data?.categories.map((cat, idx) => ({
      name: cat.name,
      type: 'bar',
      data: data.data.map(d => d[`cat${idx + 1}`]),
      itemStyle: {
        color: categoryColors[idx % categoryColors.length],
        borderRadius: [6, 6, 0, 0]
      },
      barGap: '20%',
      barCategoryGap: '40%'
    })) || []
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos Mensuales</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] w-full">
            <Skeleton className="h-full w-full" />
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos de gastos disponibles
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
            </Suspense>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
