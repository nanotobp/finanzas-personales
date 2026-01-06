'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  TrendingUp, 
  PiggyBank, 
  Target, 
  AlertCircle,
  CheckCircle,
  Zap,
  Heart
} from 'lucide-react'

interface HealthScore {
  overall: number
  categories: {
    emergency: { score: number, status: string, detail: string }
    savings: { score: number, status: string, detail: string }
    debt: { score: number, status: string, detail: string }
    budget: { score: number, status: string, detail: string }
    goals: { score: number, status: string, detail: string }
  }
  trends: {
    monthly: number
    quarterly: number
  }
  recommendations: string[]
}

export function FinancialHealthScore() {
  const supabase = createClient()

  const { data: healthScore, isLoading } = useQuery({
    queryKey: ['financial-health-score'],
    queryFn: async (): Promise<HealthScore> => {
      // 1. Emergency Fund Score (30% peso)
      const { data: accounts } = await supabase
        .from('accounts')
        .select('balance')
        .eq('is_active', true)

      const { data: monthlyExpenses } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'expense')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0
      const avgMonthlyExpenses = monthlyExpenses?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
      
      const emergencyMonths = avgMonthlyExpenses > 0 ? totalBalance / avgMonthlyExpenses : 0
      let emergencyScore = Math.min(100, (emergencyMonths / 6) * 100)
      let emergencyStatus = 'Crítico'
      let emergencyDetail = `Tienes ${emergencyMonths.toFixed(1)} meses de gastos cubiertos`
      
      if (emergencyMonths >= 6) {
        emergencyStatus = 'Excelente'
      } else if (emergencyMonths >= 3) {
        emergencyStatus = 'Bueno'
        emergencyScore = 70
      } else if (emergencyMonths >= 1) {
        emergencyStatus = 'Regular'
        emergencyScore = 40
      }

      // 2. Savings Rate Score (25% peso)
      const { data: income } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'income')
        .gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

      const totalIncome = income?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const totalExpenses = monthlyExpenses?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const monthlySavingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

      let savingsScore = Math.min(100, monthlySavingsRate * 5) // 20% = 100 puntos
      let savingsStatus = 'Crítico'
      let savingsDetail = `Tasa de ahorro: ${monthlySavingsRate.toFixed(1)}%`
      
      if (monthlySavingsRate >= 20) {
        savingsStatus = 'Excelente'
      } else if (monthlySavingsRate >= 15) {
        savingsStatus = 'Muy bueno'
      } else if (monthlySavingsRate >= 10) {
        savingsStatus = 'Bueno'
        savingsScore = 60
      } else if (monthlySavingsRate >= 5) {
        savingsStatus = 'Regular'
        savingsScore = 30
      }

      // 3. Debt Score (20% peso) - Simplificado: mientras menos deudas, mejor
      const { data: cards } = await supabase
        .from('cards')
        .select('limit')
        .eq('is_active', true)

      const totalCreditLimit = cards?.reduce((sum, card) => sum + (Number(card.limit) || 0), 0) || 0
      const debtRatio = totalCreditLimit > 0 ? 0 : 100 // Simplificado por ahora
      
      let debtScore = 100 // Sin deudas = máximo puntaje
      let debtStatus = 'Excelente'
      let debtDetail = 'Sin deudas reportadas'

      // 4. Budget Adherence Score (15% peso)
      const { data: budgets } = await supabase
        .from('budgets')
        .select('amount')

      let budgetScore = 100
      let budgetStatus = 'Excelente'
      let budgetDetail = 'Sin presupuestos activos'
      
      if (budgets && budgets.length > 0) {
        // Por ahora, si tiene presupuestos = buen score
        // TODO: Implementar cálculo real cuando exista spent
        budgetScore = 85
        budgetStatus = 'Muy bueno'
        budgetDetail = `${budgets.length} presupuesto(s) configurado(s)`
      }

      // 5. Goals Progress Score (10% peso)
      const { data: goals } = await supabase
        .from('savings_goals')
        .select('target_amount, current_amount')

      let goalsScore = 50 // Neutral si no hay metas
      let goalsStatus = 'Sin metas'
      let goalsDetail = 'No tienes metas definidas'
      
      if (goals && goals.length > 0) {
        const goalsProgress = goals.map(goal => {
          const current = Number(goal.current_amount) || 0
          const target = Number(goal.target_amount) || 1
          return (current / target) * 100
        })
        goalsScore = Math.min(100, goalsProgress.reduce((sum, progress) => sum + progress, 0) / goalsProgress.length)
        
        if (goalsScore >= 80) goalsStatus = 'Excelente'
        else if (goalsScore >= 60) goalsStatus = 'Muy bueno'
        else if (goalsScore >= 40) goalsStatus = 'Bueno'
        else if (goalsScore >= 20) goalsStatus = 'Regular'
        else goalsStatus = 'Inicial'
        
        goalsDetail = `Progreso promedio: ${goalsScore.toFixed(1)}%`
      }

      // Cálculo del score general (ponderado)
      const overallScore = Math.round(
        emergencyScore * 0.30 +
        savingsScore * 0.25 +
        debtScore * 0.20 +
        budgetScore * 0.15 +
        goalsScore * 0.10
      )

      // Generar recomendaciones
      const recommendations: string[] = []
      
      if (emergencyScore < 70) {
        recommendations.push('Prioriza construir un fondo de emergencia de 3-6 meses de gastos')
      }
      if (savingsScore < 60) {
        recommendations.push('Intenta aumentar tu tasa de ahorro al 15-20% de tus ingresos')
      }
      if (budgetScore < 80 && budgets && budgets.length > 0) {
        recommendations.push('Revisa y ajusta tus presupuestos para mejorar el cumplimiento')
      }
      if (goalsScore < 50) {
        recommendations.push('Define metas financieras específicas y medibles para el año')
      }

      return {
        overall: overallScore,
        categories: {
          emergency: { score: Math.round(emergencyScore), status: emergencyStatus, detail: emergencyDetail },
          savings: { score: Math.round(savingsScore), status: savingsStatus, detail: savingsDetail },
          debt: { score: Math.round(debtScore), status: debtStatus, detail: debtDetail },
          budget: { score: Math.round(budgetScore), status: budgetStatus, detail: budgetDetail },
          goals: { score: Math.round(goalsScore), status: goalsStatus, detail: goalsDetail }
        },
        trends: {
          monthly: 0, // Implementar después con datos históricos
          quarterly: 0
        },
        recommendations
      }
    },
    refetchInterval: 10 * 60 * 1000 // Refrescar cada 10 minutos
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getStatusIcon = (score: number) => {
    if (score >= 80) return CheckCircle
    if (score >= 60) return Shield
    if (score >= 40) return AlertCircle
    return AlertCircle
  }

  if (!healthScore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Salud Financiera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Cargando análisis de salud financiera...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Índice de Salud Financiera</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-20 bg-muted rounded mb-4"></div>
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Índice de Salud Financiera
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score General */}
        <div className="text-center space-y-2">
          <div className={`text-6xl font-bold ${getScoreColor(healthScore?.overall || 0)}`}>
            {healthScore?.overall || 0}
          </div>
          <div className="text-2xl font-semibold">
            {(healthScore?.overall || 0) >= 80 ? 'Excelente' :
             (healthScore?.overall || 0) >= 60 ? 'Muy Bueno' :
             (healthScore?.overall || 0) >= 40 ? 'Bueno' :
             (healthScore?.overall || 0) >= 20 ? 'Regular' : 'Crítico'}
          </div>
          <Progress value={healthScore?.overall || 0} className="h-3" />
        </div>

        {/* Categorías Detalladas */}
        <div className="space-y-4">
          {healthScore && Object.entries(healthScore.categories).map(([key, category]) => {
            const Icon = getStatusIcon(category.score)
            const categoryNames = {
              emergency: 'Fondo de Emergencia',
              savings: 'Tasa de Ahorro',
              debt: 'Gestión de Deudas',
              budget: 'Cumplimiento Presupuesto',
              goals: 'Progreso de Metas'
            }

            return (
              <div key={key} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${getScoreColor(category.score)}`} />
                  <div>
                    <div className="font-medium">{categoryNames[key as keyof typeof categoryNames]}</div>
                    <div className="text-sm text-muted-foreground">{category.detail}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                    {category.score}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {category.status}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>

        {/* Recomendaciones */}
        {healthScore?.recommendations && healthScore.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Zap className="h-4 w-4" />
              Acciones Recomendadas
            </div>
            <ul className="space-y-1 text-sm">
              {healthScore.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0"></span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}