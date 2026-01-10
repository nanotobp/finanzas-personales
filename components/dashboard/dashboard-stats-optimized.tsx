'use client'

import { useMemo, memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

interface DashboardStatsProps {
  userId: string
}

// Mini gráfico de línea con datos reales
const MiniSparkline = memo(({ data, color }: { data: { date: string; value: number }[], color: string }) => {
  const option = useMemo(() => ({
    grid: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date),
      show: false,
    },
    yAxis: {
      type: 'value',
      show: false,
    },
    series: [{
      data: data.map(d => d.value),
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: {
        color: color,
        width: 2,
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color + '40' },
          { offset: 1, color: color + '00' }
        ])
      }
    }],
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0]
        return `${param.name}<br/>${formatCurrency(param.value)}`
      }
    }
  }), [data, color])

  if (!data || data.length === 0) return null

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: '60px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  )
})
MiniSparkline.displayName = 'MiniSparkline'

export const DashboardStats = memo(function DashboardStats({ stats }: { stats: any }) {
  const supabase = createClient()
  
  // Obtener datos históricos para los gráficos
  const { data: chartData } = useQuery({
    queryKey: ['dashboard-charts-data'],
    queryFn: async () => {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const startDate = thirtyDaysAgo.toISOString().slice(0, 10)
      
      // Obtener transacciones de los últimos 30 días
      const { data: transactions } = await supabase
        .from('transactions')
        .select('date, type, amount')
        .gte('date', startDate)
        .order('date', { ascending: true })

      // Obtener facturas pagadas de los últimos 30 días
      const { data: invoices } = await supabase
        .from('invoices')
        .select('paid_date, amount')
        .eq('status', 'paid')
        .not('paid_date', 'is', null)
        .gte('paid_date', startDate)
        .order('paid_date', { ascending: true })

      // Procesar datos por fecha
      const dataByDate: { [key: string]: { income: number; expenses: number } } = {}
      
      transactions?.forEach(t => {
        const date = t.date
        if (!dataByDate[date]) {
          dataByDate[date] = { income: 0, expenses: 0 }
        }
        if (t.type === 'income') {
          dataByDate[date].income += Number(t.amount)
        } else if (t.type === 'expense') {
          dataByDate[date].expenses += Number(t.amount)
        }
      })

      invoices?.forEach(inv => {
        const date = inv.paid_date!
        if (!dataByDate[date]) {
          dataByDate[date] = { income: 0, expenses: 0 }
        }
        dataByDate[date].income += Number(inv.amount)
      })

      // Convertir a arrays ordenados y asegurar al menos algunos puntos
      const dates = Object.keys(dataByDate).sort()
      
      // Si no hay suficientes datos, agregar puntos con valores 0
      const minPoints = 7
      if (dates.length < minPoints) {
        for (let i = dates.length; i < minPoints; i++) {
          const date = new Date(now.getTime() - (minPoints - i - 1) * 24 * 60 * 60 * 1000)
          const dateStr = date.toISOString().slice(0, 10)
          if (!dates.includes(dateStr)) {
            dates.push(dateStr)
            dataByDate[dateStr] = { income: 0, expenses: 0 }
          }
        }
        dates.sort()
      }
      
      const incomeData = dates.map(date => ({
        date: new Date(date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' }),
        value: dataByDate[date].income
      }))
      const expensesData = dates.map(date => ({
        date: new Date(date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' }),
        value: dataByDate[date].expenses
      }))
      const netData = dates.map(date => ({
        date: new Date(date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' }),
        value: dataByDate[date].income - dataByDate[date].expenses
      }))

      // Datos acumulados para balance
      let balance = 0
      const balanceData = dates.map(date => {
        balance += dataByDate[date].income - dataByDate[date].expenses
        return {
          date: new Date(date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' }),
          value: balance + (stats?.balance || 0)
        }
      })

      return {
        incomeData,
        expensesData,
        netData,
        balanceData
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  const statCards = useMemo(() => [
    {
      title: 'Saldo Total',
      value: stats?.balance || 0,
      icon: Wallet,
      color: '#3b82f6',
      chartData: chartData?.balanceData || [],
    },
    {
      title: 'Ingresos del Mes',
      value: stats?.income || 0,
      icon: TrendingUp,
      color: '#10b981',
      chartData: chartData?.incomeData || [],
      extra: (
        <span className="block text-xs text-muted-foreground mt-1">
          Incluye facturas cobradas
        </span>
      ),
    },
    {
      title: 'Gastos del Mes',
      value: stats?.expenses || 0,
      icon: TrendingDown,
      color: '#f43f5e',
      chartData: chartData?.expensesData || [],
    },
    {
      title: 'Balance Neto',
      value: stats?.net || 0,
      icon: DollarSign,
      color: (stats?.net || 0) >= 0 ? '#10b981' : '#f43f5e',
      chartData: chartData?.netData || [],
    },
  ], [stats, chartData])

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        
        return (
          <Card 
            key={stat.title} 
            className="relative overflow-hidden transition-all duration-300 hover:shadow-md"
          >
            <div className="p-6">
              {/* Header con ícono */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-bold tracking-tight">
                    {formatCurrency(stat.value)}
                  </h3>
                </div>
                <div 
                  className="p-2.5 rounded-lg shadow-sm"
                  style={{ backgroundColor: stat.color + '20' }}
                >
                  <Icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
              </div>

              {stat.extra && <div className="mb-2">{stat.extra}</div>}

              {/* Gráfico real */}
              <div className="mt-2 -mx-2">
                <MiniSparkline data={stat.chartData} color={stat.color} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
})
