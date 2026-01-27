'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Users, Target } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

export function BenchmarkingDashboard() {
  const supabase = createClient()
  const { userId } = useAuth()

  const { data: benchmarks } = useQuery({
    queryKey: ['benchmarking-data', userId],
    queryFn: async () => {
      if (!userId) return null

      // Obtener métricas del usuario actual
      const thisMonth = new Date().toISOString().substring(0, 7)
      
      const { data: userStats } = await supabase
        .from('user_financial_benchmarks')
        .select('*')
        .eq('user_id', userId)
        .eq('month', thisMonth + '-01')
        .single()

      // Obtener promedios globales (datos agregados anónimos)
      const { data: globalAvg } = await supabase
        .from('user_financial_benchmarks')
        .select('savings_rate, budget_adherence, goals_progress')
        .eq('month', thisMonth + '-01')

      if (!globalAvg || globalAvg.length === 0) return null

      const avgSavingsRate = globalAvg.reduce((sum, b) => sum + Number(b.savings_rate || 0), 0) / globalAvg.length
      const avgBudget = globalAvg.reduce((sum, b) => sum + Number(b.budget_adherence || 0), 0) / globalAvg.length
      const avgGoals = globalAvg.reduce((sum, b) => sum + Number(b.goals_progress || 0), 0) / globalAvg.length

      return {
        user: {
          savingsRate: Number(userStats?.savings_rate || 0),
          budgetAdherence: Number(userStats?.budget_adherence || 0),
          goalsProgress: Number(userStats?.goals_progress || 0)
        },
        average: {
          savingsRate: avgSavingsRate,
          budgetAdherence: avgBudget,
          goalsProgress: avgGoals
        }
      }
    },
    enabled: !!userId
  })

  if (!benchmarks) return null

  const metrics = [
    {
      name: 'Tasa de Ahorro',
      user: benchmarks.user.savingsRate,
      avg: benchmarks.average.savingsRate,
      icon: TrendingUp,
      unit: '%'
    },
    {
      name: 'Cumplimiento Presupuesto',
      user: benchmarks.user.budgetAdherence,
      avg: benchmarks.average.budgetAdherence,
      icon: Target,
      unit: '%'
    },
    {
      name: 'Progreso Objetivos',
      user: benchmarks.user.goalsProgress,
      avg: benchmarks.average.goalsProgress,
      icon: Target,
      unit: '%'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Comparativa vs Promedio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          const diff = metric.user - metric.avg
          const isAbove = diff > 0

          return (
            <div key={metric.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{metric.name}</span>
                </div>
                <Badge variant={isAbove ? "default" : "secondary"}>
                  {isAbove ? '+' : ''}{diff.toFixed(1)}{metric.unit} vs promedio
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Tu resultado</div>
                  <div className="text-2xl font-bold">{metric.user.toFixed(1)}{metric.unit}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Promedio</div>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {metric.avg.toFixed(1)}{metric.unit}
                  </div>
                </div>
              </div>
              <Progress value={metric.user} className="h-2" />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
