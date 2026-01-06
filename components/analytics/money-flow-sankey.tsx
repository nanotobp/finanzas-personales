'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, value, totalExpenses } = props
  const percentage = ((value / totalExpenses) * 100).toFixed(0)
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: `hsl(${(value / totalExpenses) * 360}, 70%, 60%)`,
          stroke: '#fff',
          strokeWidth: 2,
        }}
      />
      {width > 60 && height > 30 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={14}
            fontWeight="bold"
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
          >
            {percentage}%
          </text>
        </>
      )}
    </g>
  )
}

export function MoneyFlowSankey() {
  const supabase = createClient()

  const { data: flowData, isLoading } = useQuery({
    queryKey: ['money-flow'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Últimos 30 días
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type, categories(name, color)')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', thirtyDaysAgo.toISOString())
        .limit(1000)

      // Agrupar por categoría
      const categoryMap = new Map()
      transactions?.forEach(t => {
        const category = (t.categories as any)?.name || 'Sin categoría'
        const current = categoryMap.get(category) || { name: category, value: 0, color: (t.categories as any)?.color || '#94a3b8' }
        current.value += Number(t.amount)
        categoryMap.set(category, current)
      })

      return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value)
    },
  })

  if (isLoading) {
    return <Card><CardContent className="h-96 flex items-center justify-center">Cargando...</CardContent></Card>
  }

  const totalExpenses = flowData?.reduce((sum, cat) => sum + cat.value, 0) || 0

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.value / totalExpenses) * 100).toFixed(1)
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Gs {data.value.toLocaleString('es-CO')} ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flujo de Dinero por Categoría</CardTitle>
        <p className="text-sm text-muted-foreground">
          Últimos 30 días - Total: Gs {totalExpenses.toLocaleString('es-CO')}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <Treemap
            data={flowData}
            dataKey="value"
            stroke="#fff"
            fill="#8b5cf6"
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
