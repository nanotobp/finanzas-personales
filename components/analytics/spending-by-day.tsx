'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { CalendarDays } from 'lucide-react'

export function SpendingByDayOfWeek() {
  const supabase = createClient()

  const { data: dayData = [] } = useQuery({
    queryKey: ['spending-by-day-of-week'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Últimos 30 días
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const { data, error } = await supabase
        .from('transactions')
        .select('date, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', startDate.toISOString().split('T')[0])

      if (error) throw error

      // Agrupar por día de la semana
      const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      const grouped: any = {}
      
      daysOfWeek.forEach((day, index) => {
        grouped[index] = { day, total: 0, count: 0 }
      })

      data.forEach((transaction) => {
        const dayOfWeek = new Date(transaction.date).getDay()
        grouped[dayOfWeek].total += Number(transaction.amount)
        grouped[dayOfWeek].count += 1
      })

      return Object.values(grouped).map((d: any) => ({
        ...d,
        average: d.count > 0 ? d.total / d.count : 0
      }))
    }
  })

  const maxValue = Math.max(...dayData.map((d: any) => d.total), 0)

  const getColor = (value: number) => {
    const percentage = (value / maxValue) * 100
    if (percentage > 75) return '#ef4444' // red
    if (percentage > 50) return '#f59e0b' // orange
    if (percentage > 25) return '#eab308' // yellow
    return '#22c55e' // green
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Gasto por Día de la Semana
        </CardTitle>
        <CardDescription>
          Promedio de gastos según el día - Últimos 30 días
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dayData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{data.day}</p>
                        <p className="text-sm text-muted-foreground">
                          Total: Gs {data.total.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Transacciones: {data.count}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Promedio: Gs {Math.round(data.average).toLocaleString()}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                {dayData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.total)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            {dayData.slice(0, 4).map((day: any) => (
              <div key={day.day} className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{day.day}</p>
                <p className="text-xl font-bold">Gs {(day.total / 1000).toFixed(0)}k</p>
                <p className="text-xs text-muted-foreground">{day.count} transacciones</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
