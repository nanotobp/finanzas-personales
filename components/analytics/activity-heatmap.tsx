'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

export function ActivityHeatmap() {
  const supabase = createClient()
  const { userId } = useAuth()

  const { data: heatmapData = [] } = useQuery({
    queryKey: ['activity-heatmap'],
    queryFn: async () => {
      if (!userId) return []

      // Últimos 90 días
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 90)

      const { data, error } = await supabase
        .from('transactions')
        .select('date, amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date')

      if (error) throw error

      // Agrupar por fecha
      const grouped = data.reduce((acc: any, curr) => {
        const date = curr.date
        if (!acc[date]) {
          acc[date] = { date, total: 0, count: 0 }
        }
        acc[date].total += Number(curr.amount)
        acc[date].count += 1
        return acc
      }, {})

      return Object.values(grouped)
    },
    enabled: !!userId,
  })

  // Calcular el valor máximo para la escala de colores
  const maxAmount = Math.max(...heatmapData.map((d: any) => d.total), 0)

  // Generar últimos 90 días
  const getLast90Days = () => {
    const days = []
    for (let i = 89; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date.toISOString().split('T')[0])
    }
    return days
  }

  const last90Days = getLast90Days()

  const getIntensity = (date: string) => {
    const dayData = heatmapData.find((d: any) => d.date === date) as { date: string; total: number; count: number } | undefined
    if (!dayData) return 0
    const percentage = (dayData.total / maxAmount) * 100
    if (percentage === 0) return 0
    if (percentage < 25) return 1
    if (percentage < 50) return 2
    if (percentage < 75) return 3
    return 4
  }

  const getColor = (intensity: number) => {
    const colors = [
      'bg-gray-100 dark:bg-gray-800',
      'bg-emerald-200 dark:bg-emerald-900/50',
      'bg-emerald-400 dark:bg-emerald-700',
      'bg-emerald-600 dark:bg-emerald-600',
      'bg-emerald-800 dark:bg-emerald-500'
    ]
    return colors[intensity]
  }

  // Agrupar por semanas
  const weeks: string[][] = []
  for (let i = 0; i < last90Days.length; i += 7) {
    weeks.push(last90Days.slice(i, i + 7))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Mapa de Calor de Actividad
        </CardTitle>
        <CardDescription>
          Últimos 90 días - Intensidad de gasto por día
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <div className="inline-flex flex-col gap-1 min-w-max">
              <div className="flex gap-1 mb-2 text-xs text-muted-foreground">
                <div className="w-6"></div>
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                  <div key={i} className="w-3 text-center">
                    {day}
                  </div>
                ))}
              </div>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex gap-1 items-center">
                  <div className="w-6 text-xs text-muted-foreground">
                    {weekIndex % 4 === 0 && new Date(week[0]).toLocaleDateString('es', { month: 'short' })}
                  </div>
                  {week.map((date, dayIndex) => {
                    const intensity = getIntensity(date)
                    const dayData = heatmapData.find((d: any) => d.date === date) as { date: string; total: number; count: number } | undefined
                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          'w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary',
                          getColor(intensity)
                        )}
                        title={`${date}: ${dayData ? `Gs ${dayData.total.toLocaleString()} (${dayData.count} transacciones)` : 'Sin actividad'}`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t">
            <span>Menos</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((intensity) => (
                <div
                  key={intensity}
                  className={cn('w-3 h-3 rounded-sm', getColor(intensity))}
                />
              ))}
            </div>
            <span>Más</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
