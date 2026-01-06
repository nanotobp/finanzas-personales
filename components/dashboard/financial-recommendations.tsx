'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  PiggyBank,
  Target,
  DollarSign
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface FinancialRecommendation {
  id: number
  type: 'warning' | 'success' | 'info' | 'tip'
  category: string
  title: string
  description: string
}

export function FinancialRecommendations() {
  const supabase = createClient()

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['financial-recommendations'],
    queryFn: async () => {
      // Obtener datos financieros
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(100)

      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)

      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')

      const { data: categories } = await supabase
        .from('categories')
        .select('*')

      // Generar recomendaciones basadas en análisis
      const recs: FinancialRecommendation[] = []
      let id = 1

      if (!transactions || transactions.length === 0) {
        recs.push({
          id: id++,
          type: 'info',
          category: 'Primeros Pasos',
          title: 'Comienza a registrar transacciones',
          description: 'No hay transacciones registradas. Empieza a registrar tus ingresos y gastos para obtener recomendaciones personalizadas.'
        })
        return recs
      }

      // Analizar transacciones recientes
      const recentTransactions = transactions.slice(0, 30)
      const expenses = recentTransactions.filter(t => t.type === 'expense')
      const income = recentTransactions.filter(t => t.type === 'income')

      const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0)
      const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0)
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

      // Recomendación sobre tasa de ahorro
      if (savingsRate < 10) {
        recs.push({
          id: id++,
          type: 'warning',
          category: 'Ahorro',
          title: 'Tasa de ahorro muy baja',
          description: `Tu tasa de ahorro es del ${savingsRate.toFixed(1)}%. Se recomienda ahorrar al menos el 20% de tus ingresos.`
        })
      } else if (savingsRate >= 20) {
        recs.push({
          id: id++,
          type: 'success',
          category: 'Ahorro',
          title: '¡Excelente tasa de ahorro!',
          description: `Estás ahorrando el ${savingsRate.toFixed(1)}% de tus ingresos. ¡Sigue así!`
        })
      }

      // Analizar gastos por categoría
      const expensesByCategory: Record<string, number> = {}
      expenses.forEach(exp => {
        const catId = exp.category_id || 'sin-categoria'
        expensesByCategory[catId] = (expensesByCategory[catId] || 0) + Number(exp.amount)
      })

      const sortedCategories = Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b - a)

      if (sortedCategories.length > 0) {
        const topCategory = sortedCategories[0]
        const topCategoryPercentage = (topCategory[1] / totalExpenses) * 100
        
        if (topCategoryPercentage > 40) {
          recs.push({
            id: id++,
            type: 'warning',
            category: 'Gastos',
            title: 'Concentración alta en una categoría',
            description: `El ${topCategoryPercentage.toFixed(1)}% de tus gastos está en una sola categoría. Considera diversificar tu presupuesto.`
          })
        }
      }

      // Recomendaciones sobre presupuestos
      if (!budgets || budgets.length === 0) {
        recs.push({
          id: id++,
          type: 'tip',
          category: 'Presupuesto',
          title: 'Crea presupuestos mensuales',
          description: 'Establece presupuestos para tus categorías principales para controlar mejor tus gastos.'
        })
      }

      // Recomendaciones sobre cuentas
      if (accounts && accounts.length > 0) {
        const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)
        const averageMonthlyExpense = totalExpenses / (expenses.length > 0 ? 1 : 1)
        const monthsOfReserve = totalBalance / (averageMonthlyExpense || 1)

        if (monthsOfReserve < 3) {
          recs.push({
            id: id++,
            type: 'warning',
            category: 'Fondo de Emergencia',
            title: 'Incrementa tu fondo de emergencia',
            description: `Tienes reservas para ${monthsOfReserve.toFixed(1)} mes(es). Se recomienda tener al menos 3-6 meses de gastos.`
          })
        } else if (monthsOfReserve >= 6) {
          recs.push({
            id: id++,
            type: 'success',
            category: 'Fondo de Emergencia',
            title: 'Fondo de emergencia saludable',
            description: `Tienes reservas para ${monthsOfReserve.toFixed(1)} meses. Considera invertir el excedente.`
          })
        }
      }

      // Recomendaciones adicionales generales
      const generalTips = [
        {
          type: 'tip' as const,
          category: 'Estrategia',
          title: 'Aplica la regla 50/30/20',
          description: '50% para necesidades, 30% para gustos y 20% para ahorro e inversión.'
        },
        {
          type: 'info' as const,
          category: 'Planificación',
          title: 'Revisa tus suscripciones',
          description: 'Cancela servicios que no uses regularmente para reducir gastos fijos.'
        },
        {
          type: 'tip' as const,
          category: 'Inversión',
          title: 'Considera invertir parte de tus ahorros',
          description: 'Una vez tengas un fondo de emergencia, considera opciones de inversión a largo plazo.'
        },
        {
          type: 'info' as const,
          category: 'Deuda',
          title: 'Prioriza deudas de alto interés',
          description: 'Paga primero las deudas con tasas de interés más altas (tarjetas de crédito).'
        },
        {
          type: 'tip' as const,
          category: 'Automatización',
          title: 'Automatiza tus ahorros',
          description: 'Configura transferencias automáticas a tu cuenta de ahorros cada mes.'
        },
        {
          type: 'info' as const,
          category: 'Gastos',
          title: 'Registra todos tus gastos',
          description: 'Los gastos pequeños suman. Registra incluso las compras menores para un control total.'
        },
        {
          type: 'tip' as const,
          category: 'Metas',
          title: 'Establece metas financieras claras',
          description: 'Define objetivos específicos, medibles y con plazos definidos.'
        },
      ]

      // Agregar tips generales hasta llegar a 30 recomendaciones
      generalTips.forEach(tip => {
        if (recs.length < 30) {
          recs.push({ ...tip, id: id++ })
        }
      })

      return recs
    },
  })

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'success': return <CheckCircle className="h-4 w-4" />
      case 'tip': return <Lightbulb className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'warning': return 'destructive'
      case 'success': return 'default'
      default: return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Recomendaciones Financieras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Analizando...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Recomendaciones Financieras
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {recommendations?.map((rec) => (
              <div
                key={rec.id}
                className="flex gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="mt-1">
                  <Badge variant={getVariant(rec.type)} className="gap-1">
                    {getIcon(rec.type)}
                  </Badge>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {rec.category}
                    </span>
                  </div>
                  <h4 className="font-semibold mb-1">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
