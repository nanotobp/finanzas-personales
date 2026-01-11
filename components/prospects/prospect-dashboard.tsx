'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Users, Target, DollarSign, Percent, Award } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import { useMemo, memo } from 'react'

function ProspectDashboardComponent() {
  const supabase = createClient()

  const { data: prospects } = useQuery({
    queryKey: ['prospects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')

      if (error) throw error
      return data
    },
  })

  // Calcular métricas con useMemo
  const metrics = useMemo(() => {
    const totalProspects = prospects?.length || 0
    const wonProspects = prospects?.filter(p => p.status === 'won').length || 0
    const lostProspects = prospects?.filter(p => p.status === 'lost').length || 0
    const activeProspects = prospects?.filter(p => !['won', 'lost'].includes(p.status)).length || 0

    const potentialRevenue = prospects
      ?.filter(p => !['won', 'lost'].includes(p.status))
      .reduce((sum, p) => sum + Number(p.potential_amount || 0), 0) || 0

    const wonRevenue = prospects
      ?.filter(p => p.status === 'won')
      .reduce((sum, p) => sum + Number(p.potential_amount || 0), 0) || 0

    const weightedPipeline = prospects
      ?.filter(p => !['won', 'lost'].includes(p.status))
      .reduce((sum, p) => sum + (Number(p.potential_amount || 0) * (p.probability || 50) / 100), 0) || 0

    const conversionRate = totalProspects > 0 
      ? ((wonProspects / (wonProspects + lostProspects)) * 100) || 0
      : 0

    const avgDealSize = wonProspects > 0 ? wonRevenue / wonProspects : 0

    return {
      totalProspects,
      wonProspects,
      lostProspects,
      activeProspects,
      potentialRevenue,
      wonRevenue,
      weightedPipeline,
      conversionRate,
      avgDealSize
    }
  }, [prospects])

  const { totalProspects, wonProspects, lostProspects, activeProspects, potentialRevenue, wonRevenue, weightedPipeline, conversionRate, avgDealSize } = metrics

  // Datos para gráfico de embudo
  const funnelData = [
    { value: prospects?.filter(p => p.status === 'lead').length || 0, name: 'Prospecto' },
    { value: prospects?.filter(p => p.status === 'contacted').length || 0, name: 'Contactado' },
    { value: prospects?.filter(p => p.status === 'meeting').length || 0, name: 'Reunión' },
    { value: prospects?.filter(p => p.status === 'proposal').length || 0, name: 'Propuesta' },
    { value: prospects?.filter(p => p.status === 'negotiation').length || 0, name: 'Negociación' },
    { value: wonProspects, name: 'Ganado' },
  ]

  const funnelOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}'
    },
    series: [{
      type: 'funnel',
      left: '10%',
      width: '80%',
      label: {
        formatter: '{b}: {c}'
      },
      data: funnelData
    }]
  }

  // Datos para gráfico de dona (estado de prospectos)
  const statusData = [
    { value: activeProspects, name: 'Activos' },
    { value: wonProspects, name: 'Ganados' },
    { value: lostProspects, name: 'Perdidos' },
  ]

  const donutOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      bottom: '0%',
      left: 'center'
    },
    series: [{
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
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      data: statusData,
      color: ['#3b82f6', '#10b981', '#ef4444']
    }]
  }

  // Gráfico de dinero potencial por temperatura
  const temperatureRevenue = {
    hot: prospects?.filter(p => p.temperature === 'hot' && !['won', 'lost'].includes(p.status))
      .reduce((sum, p) => sum + Number(p.potential_amount || 0), 0) || 0,
    warm: prospects?.filter(p => p.temperature === 'warm' && !['won', 'lost'].includes(p.status))
      .reduce((sum, p) => sum + Number(p.potential_amount || 0), 0) || 0,
    cold: prospects?.filter(p => p.temperature === 'cold' && !['won', 'lost'].includes(p.status))
      .reduce((sum, p) => sum + Number(p.potential_amount || 0), 0) || 0,
  }

  const barOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        return `${params[0].name}<br/>Gs. ${params[0].value.toLocaleString('es-PY')}`
      }
    },
    xAxis: {
      type: 'category',
      data: ['🔥 Caliente', '🌤️ Tibio', '❄️ Frío']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [temperatureRevenue.hot, temperatureRevenue.warm, temperatureRevenue.cold],
      type: 'bar',
      itemStyle: {
        color: (params: any) => {
          const colors = ['#ef4444', '#f59e0b', '#3b82f6']
          return colors[params.dataIndex]
        }
      },
      label: {
        show: true,
        position: 'top',
        formatter: (params: any) => `Gs. ${(params.value / 1000000).toFixed(1)}M`
      }
    }]
  }

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prospectos Activos
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProspects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalProspects} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dinero Potencial
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(potentialRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pipeline ponderado: {formatCurrency(weightedPipeline)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dinero Concretado
            </CardTitle>
            <Award className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(wonRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {wonProspects} prospectos ganados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Conversión
            </CardTitle>
            <Percent className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio por venta: {formatCurrency(avgDealSize)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Embudo de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={funnelOption} style={{ height: '350px' }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Prospectos</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={donutOption} style={{ height: '350px' }} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline por Temperatura</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={barOption} style={{ height: '300px' }} />
          </CardContent>
        </Card>
      </div>

      {/* Resumen adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total en Pipeline</p>
              <p className="text-2xl font-bold">{formatCurrency(potentialRevenue + wonRevenue)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-green-600">
                {((wonProspects / totalProspects) * 100 || 0).toFixed(1)}%
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Prospectos Perdidos</p>
              <p className="text-2xl font-bold text-red-600">{lostProspects}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const ProspectDashboard = memo(ProspectDashboardComponent)
