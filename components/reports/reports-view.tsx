'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Download, Calendar } from 'lucide-react'
import ReactECharts from 'echarts-for-react'

export function ReportsView() {
  const supabase = createClient()
  const [selectedYear] = useState(new Date().getFullYear())

  const { data: yearlyData } = useQuery({
    queryKey: ['yearly-report', selectedYear],
    queryFn: async () => {
      const months = []
      for (let i = 0; i < 12; i++) {
        const date = new Date(selectedYear, i, 1)
        months.push(date.toISOString().slice(0, 7))
      }

      const results = await Promise.all(
        months.map(async (month) => {
          const startDate = `${month}-01`
          const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
            .toISOString().split('T')[0]

          // Ingresos directos
          const { data: income } = await supabase
            .from('transactions')
            .select('amount')
            .eq('type', 'income')
            .gte('date', startDate)
            .lte('date', endDate)

          // Facturas cobradas
          const { data: invoices } = await supabase
            .from('invoices')
            .select('amount')
            .eq('status', 'paid')
            .gte('paid_date', startDate)
            .lte('paid_date', endDate)

          // Gastos
          const { data: expenses } = await supabase
            .from('transactions')
            .select('amount')
            .eq('type', 'expense')
            .gte('date', startDate)
            .lte('date', endDate)

          const totalIncome = (income?.reduce((sum, t) => sum + Number(t.amount), 0) || 0)
            + (invoices?.reduce((sum, i) => sum + Number(i.amount), 0) || 0)
          const totalExpenses = expenses?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

          return {
            month,
            income: totalIncome,
            expenses: totalExpenses,
            profit: totalIncome - totalExpenses,
          }
        })
      )

      return results
    },
  })

  const { data: categoryBreakdown } = useQuery({
    queryKey: ['category-breakdown', selectedYear],
    queryFn: async () => {
      const startDate = `${selectedYear}-01-01`
      const endDate = `${selectedYear}-12-31`

      const { data: expenses } = await supabase
        .from('transactions')
        .select('amount, categories(name, color)')
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate)
        .not('category_id', 'is', null)

      const grouped = expenses?.reduce((acc: any, t: any) => {
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
  })

  const totalIncome = yearlyData?.reduce((sum, m) => sum + m.income, 0) || 0
  const totalExpenses = yearlyData?.reduce((sum, m) => sum + m.expenses, 0) || 0
  const totalProfit = totalIncome - totalExpenses

  const lineChartOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Ingresos', 'Gastos', 'Beneficio']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: yearlyData?.map(m => {
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
        data: yearlyData?.map(m => m.income) || [],
        smooth: true,
        itemStyle: { color: '#10b981' }
      },
      {
        name: 'Gastos',
        type: 'line',
        data: yearlyData?.map(m => m.expenses) || [],
        smooth: true,
        itemStyle: { color: '#ef4444' }
      },
      {
        name: 'Beneficio',
        type: 'line',
        data: yearlyData?.map(m => m.profit) || [],
        smooth: true,
        itemStyle: { color: '#3b82f6' }
      }
    ]
  }

  const pieChartOption = {
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
        radius: '50%',
        data: categoryBreakdown || [],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  const handleExport = () => {
    if (!yearlyData) return

    const csvContent = [
      ['Mes', 'Ingresos', 'Gastos', 'Beneficio'].join(','),
      ...yearlyData.map(m => [
        new Date(m.month + '-01').toLocaleDateString('es-PY', { month: 'long', year: 'numeric' }),
        m.income,
        m.expenses,
        m.profit
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte-${selectedYear}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="mb-2 text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
        <strong>💡 Nota:</strong> Los reportes incluyen automáticamente todas las facturas pagadas además de los ingresos y gastos registrados manualmente.
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="h-5 w-5" />
          <span className="font-medium">Año {selectedYear}</span>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Gastos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Beneficio Neto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfit)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolución Anual</CardTitle>
        </CardHeader>
        <CardContent>
          <ReactECharts option={lineChartOption} style={{ height: '400px' }} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoría (Anual)</CardTitle>
        </CardHeader>
        <CardContent>
          <ReactECharts option={pieChartOption} style={{ height: '400px' }} />
        </CardContent>
      </Card>
    </div>
  )
}
