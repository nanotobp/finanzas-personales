'use client'

import { lazy, Suspense, memo, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getMonthEndDate } from '@/lib/utils'

const ReactECharts = lazy(() => import('echarts-for-react'))

interface DashboardChartsProps {
  userId: string
}

const ChartSkeleton = () => (
  <div className="h-[300px] space-y-3">
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-[250px] w-full" />
  </div>
)

export const DashboardCharts = memo(function DashboardCharts({ userId }: DashboardChartsProps) {
  const supabase = createClient()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: expensesByCategory, isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses-by-category', currentMonth],
    queryFn: async () => {
      const startDate = `${currentMonth}-01`
      const endDate = getMonthEndDate(currentMonth)

      const { data } = await supabase
        .from('transactions')
        .select('amount, categories(name, color)')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate)
        .not('category_id', 'is', null)

      const grouped = data?.reduce((acc: any, t: any) => {
        const categoryName = t.categories?.name || 'Sin categoría'
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            value: 0,
            itemStyle: { color: t.categories?.color || '#64748b' }
          }
        }
        acc[categoryName].value += Number(t.amount)
        return acc
      }, {})

      return Object.values(grouped || {})
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    gcTime: 10 * 60 * 1000,
  })

  const { data: monthlyTrend, isLoading: loadingTrend } = useQuery({
    queryKey: ['monthly-trend'],
    queryFn: async () => {
      const months = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        months.push(date.toISOString().slice(0, 7))
      }

      // Optimización: Una sola query con todos los datos
      const firstMonth = months[0]
      const lastMonth = months[months.length - 1]
      const startDate = `${firstMonth}-01`
      const endDate = getMonthEndDate(lastMonth)

      const { data: allTransactions } = await supabase
        .from('transactions')
        .select('amount, type, date')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)

      // Agrupar por mes en el cliente (más eficiente que 6 queries)
      const results = months.map(month => {
        const monthTransactions = allTransactions?.filter(t =>
          t.date.startsWith(month)
        ) || []

        return {
          month,
          income: monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0),
          expenses: monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0),
        }
      })

      return results
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    gcTime: 10 * 60 * 1000,
  })

  // Memoizar opciones de gráficos para evitar re-renders innecesarios
  const pieOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ₲ {c} ({d}%)'
    },
    legend: {
      bottom: 0,
      left: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: expensesByCategory || []
      }
    ]
  }), [expensesByCategory])

  const lineOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Ingresos', 'Gastos']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: monthlyTrend?.map(m => {
        const date = new Date(m.month + '-01')
        return date.toLocaleDateString('es-PY', { month: 'short' })
      }) || []
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Ingresos',
        type: 'line',
        data: monthlyTrend?.map(m => m.income) || [],
        smooth: true,
        itemStyle: { color: '#10b981' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0)' }
            ]
          }
        }
      },
      {
        name: 'Gastos',
        type: 'line',
        data: monthlyTrend?.map(m => m.expenses) || [],
        smooth: true,
        itemStyle: { color: '#ef4444' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0)' }
            ]
          }
        }
      }
    ]
  }), [monthlyTrend])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingExpenses ? (
            <ChartSkeleton />
          ) : (
            <Suspense fallback={<ChartSkeleton />}>
              <ReactECharts
                option={pieOption}
                style={{ height: '300px' }}
                lazyUpdate={true}
                notMerge={true}
                opts={{ renderer: 'canvas' }}
              />
            </Suspense>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tendencia Últimos 6 Meses</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTrend ? (
            <ChartSkeleton />
          ) : (
            <Suspense fallback={<ChartSkeleton />}>
              <ReactECharts
                option={lineOption}
                style={{ height: '300px' }}
                lazyUpdate={true}
                notMerge={true}
                opts={{ renderer: 'canvas' }}
              />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </div>
  )
})
