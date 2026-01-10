'use client'

import { memo } from 'react'
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
  Target,
  Zap,
  Shield,
  Clock,
  Award
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency, getMonthEndDate } from '@/lib/utils'

interface FinancialRecommendation {
  id: number
  type: 'warning' | 'success' | 'info' | 'tip' | 'urgent'
  category: string
  title: string
  description: string
  priority: number
}

export const FinancialRecommendationsAdvanced = memo(function FinancialRecommendationsAdvanced() {
  const supabase = createClient()

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['financial-recommendations-advanced'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const today = new Date()
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
      
      const currentMonthEnd = getMonthEndDate(currentMonth)
      const lastMonthEnd = getMonthEndDate(lastMonthStr)

      // Obtener TODOS los datos financieros
      const [
        { data: transactions },
        { data: accounts },
        { data: budgets },
        { data: categories },
        { data: goals },
        { data: subscriptions },
        { data: invoices },
        { data: cards },
      ] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(200),
        supabase.from('accounts').select('*').eq('user_id', user.id),
        supabase.from('budgets').select('*').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('savings_goals').select('*').eq('user_id', user.id),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('invoices').select('*').eq('user_id', user.id),
        supabase.from('cards').select('*').eq('user_id', user.id).eq('is_active', true),
      ])

      const recs: FinancialRecommendation[] = []
      let id = 1

      // === ANÁLISIS BÁSICO ===
      if (!transactions || transactions.length === 0) {
        recs.push({
          id: id++,
          type: 'info',
          category: 'Primeros Pasos',
          title: 'Comienza a registrar transacciones',
          description: 'Registra tu primera transacción para obtener recomendaciones personalizadas.',
          priority: 100
        })
        return recs.sort((a, b) => b.priority - a.priority)
      }

      // Análisis de periodos
      const currentTx = transactions.filter(t => t.date >= `${currentMonth}-01` && t.date <= currentMonthEnd)
      const lastMonthTx = transactions.filter(t => t.date >= `${lastMonthStr}-01` && t.date <= lastMonthEnd)
      const last30Days = transactions.filter(t => {
        const txDate = new Date(t.date)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return txDate >= thirtyDaysAgo
      })

      const currentIncome = currentTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const currentExpenses = currentTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      const lastIncome = lastMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const lastExpenses = lastMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

      const totalBalance = accounts?.reduce((s, a) => s + Number(a.balance), 0) || 0
      const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0
      const emergencyFundMonths = currentExpenses > 0 ? totalBalance / currentExpenses : 0

      // === 1. SALUD FINANCIERA GENERAL (10 recomendaciones) ===
      
      if (savingsRate < 0) {
        recs.push({
          id: id++, type: 'urgent', category: 'Salud Financiera', priority: 95,
          title: '⚠️ Estás gastando más de lo que ganas',
          description: `Tus gastos (${formatCurrency(currentExpenses)}) superan tus ingresos (${formatCurrency(currentIncome)}). Urgente: revisa tus gastos o aumenta ingresos.`
        })
      } else if (savingsRate < 5) {
        recs.push({
          id: id++, type: 'warning', category: 'Ahorro', priority: 85,
          title: 'Tasa de ahorro muy baja',
          description: `Solo ahorras el ${savingsRate.toFixed(1)}% de tus ingresos. Meta mínima: 10-15%.`
        })
      } else if (savingsRate < 10) {
        recs.push({
          id: id++, type: 'tip', category: 'Ahorro', priority: 70,
          title: 'Mejora tu tasa de ahorro',
          description: `Ahorras ${savingsRate.toFixed(1)}%. Intenta llegar al 20% para metas a largo plazo.`
        })
      } else if (savingsRate >= 20) {
        recs.push({
          id: id++, type: 'success', category: 'Ahorro', priority: 50,
          title: '✅ Excelente tasa de ahorro',
          description: `¡Felicidades! Ahorras el ${savingsRate.toFixed(1)}% de tus ingresos.`
        })
      }

      if (emergencyFundMonths < 1) {
        recs.push({
          id: id++, type: 'urgent', category: 'Fondo de Emergencia', priority: 90,
          title: 'Sin fondo de emergencia',
          description: `Solo tienes ${formatCurrency(totalBalance)}. Meta urgente: 1 mes de gastos (${formatCurrency(currentExpenses)}).`
        })
      } else if (emergencyFundMonths < 3) {
        recs.push({
          id: id++, type: 'warning', category: 'Fondo de Emergencia', priority: 75,
          title: 'Fondo de emergencia insuficiente',
          description: `Tienes ${emergencyFundMonths.toFixed(1)} meses de gastos. Meta: 3-6 meses (${formatCurrency(currentExpenses * 3)}).`
        })
      } else if (emergencyFundMonths >= 6) {
        recs.push({
          id: id++, type: 'success', category: 'Fondo de Emergencia', priority: 40,
          title: '✅ Fondo de emergencia saludable',
          description: `Tienes ${emergencyFundMonths.toFixed(1)} meses de reserva. Considera invertir el excedente.`
        })
      }

      // Análisis de tendencia de ingresos
      if (lastIncome > 0) {
        const incomeChange = ((currentIncome - lastIncome) / lastIncome) * 100
        if (incomeChange < -20) {
          recs.push({
            id: id++, type: 'warning', category: 'Ingresos', priority: 80,
            title: 'Caída significativa en ingresos',
            description: `Tus ingresos bajaron ${Math.abs(incomeChange).toFixed(1)}% vs mes anterior. Diversifica fuentes de ingreso.`
          })
        } else if (incomeChange > 20) {
          recs.push({
            id: id++, type: 'success', category: 'Ingresos', priority: 45,
            title: '✅ Crecimiento en ingresos',
            description: `Tus ingresos aumentaron ${incomeChange.toFixed(1)}%. Aprovecha para incrementar ahorro.`
          })
        }
      }

      // Análisis de tendencia de gastos
      if (lastExpenses > 0) {
        const expenseChange = ((currentExpenses - lastExpenses) / lastExpenses) * 100
        if (expenseChange > 20) {
          recs.push({
            id: id++, type: 'warning', category: 'Gastos', priority: 78,
            title: 'Aumento notable en gastos',
            description: `Tus gastos subieron ${expenseChange.toFixed(1)}% vs mes anterior. Revisa categorías.`
          })
        } else if (expenseChange < -10) {
          recs.push({
            id: id++, type: 'success', category: 'Gastos', priority: 42,
            title: '✅ Reducción de gastos',
            description: `Redujiste gastos en ${Math.abs(expenseChange).toFixed(1)}%. ¡Excelente control!`
          })
        }
      }

      // === 2. ANÁLISIS POR CATEGORÍAS (15 recomendaciones) ===
      const expensesByCategory: Record<string, { amount: number, count: number, name: string }> = {}
      currentTx.filter(t => t.type === 'expense').forEach(exp => {
        const catId = exp.category_id || 'sin-categoria'
        const cat = categories?.find(c => c.id === catId)
        if (!expensesByCategory[catId]) {
          expensesByCategory[catId] = { amount: 0, count: 0, name: cat?.name || 'Sin categoría' }
        }
        expensesByCategory[catId].amount += Number(exp.amount)
        expensesByCategory[catId].count++
      })

      const sortedCats = Object.entries(expensesByCategory).sort(([, a], [, b]) => b.amount - a.amount)
      
      if (sortedCats.length > 0) {
        const topCat = sortedCats[0][1]
        const topCatPct = (topCat.amount / currentExpenses) * 100
        
        if (topCatPct > 50) {
          recs.push({
            id: id++, type: 'warning', category: 'Gastos por Categoría', priority: 73,
            title: `Concentración alta: ${topCat.name}`,
            description: `${topCatPct.toFixed(1)}% (${formatCurrency(topCat.amount)}) en esta categoría. Diversifica tu presupuesto.`
          })
        }

        // Detectar gastos inusuales por categoría
        sortedCats.slice(0, 5).forEach(([catId, data]) => {
          const lastMonthCat = lastMonthTx.filter(t => t.type === 'expense' && t.category_id === catId)
          const lastMonthAmount = lastMonthCat.reduce((s, t) => s + Number(t.amount), 0)
          
          if (lastMonthAmount > 0) {
            const change = ((data.amount - lastMonthAmount) / lastMonthAmount) * 100
            if (change > 50) {
              recs.push({
                id: id++, type: 'info', category: 'Gastos por Categoría', priority: 60,
                title: `Aumento en "${data.name}"`,
                description: `Gastaste ${formatCurrency(data.amount)} (+${change.toFixed(0)}% vs mes anterior). ${data.count} transacciones.`
              })
            }
          }
        })
      }

      // Análisis de frecuencia de transacciones
      const avgDailyTx = currentTx.length / new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
      if (avgDailyTx < 0.5 && currentTx.length > 5) {
        recs.push({
          id: id++, type: 'tip', category: 'Hábitos', priority: 55,
          title: 'Aumenta frecuencia de registro',
          description: `Registras ~${(avgDailyTx * 7).toFixed(1)} transacciones/semana. Registra diariamente para mejor control.`
        })
      }

      // === 3. PRESUPUESTOS (10 recomendaciones) ===
      if (!budgets || budgets.length === 0) {
        recs.push({
          id: id++, type: 'tip', category: 'Presupuesto', priority: 65,
          title: 'Crea presupuestos mensuales',
          description: 'Establece límites por categoría para controlar gastos. Método 50/30/20: necesidades/gustos/ahorro.'
        })
      } else {
        budgets.forEach(budget => {
          const spent = expensesByCategory[budget.category_id]?.amount || 0
          const usage = (spent / budget.amount) * 100
          
          if (usage > 100) {
            recs.push({
              id: id++, type: 'urgent', category: 'Presupuesto', priority: 88,
              title: `🚨 Presupuesto excedido`,
              description: `Gastaste ${formatCurrency(spent)} de ${formatCurrency(budget.amount)} (${usage.toFixed(0)}%).`
            })
          } else if (usage > 90) {
            recs.push({
              id: id++, type: 'warning', category: 'Presupuesto', priority: 76,
              title: `Presupuesto casi agotado`,
              description: `Usaste ${usage.toFixed(0)}% de ${formatCurrency(budget.amount)}. Quedan ${formatCurrency(budget.amount - spent)}.`
            })
          } else if (usage < 50 && new Date().getDate() > 20) {
            recs.push({
              id: id++, type: 'success', category: 'Presupuesto', priority: 38,
              title: `✅ Presupuesto bajo control`,
              description: `Solo usaste ${usage.toFixed(0)}% (${formatCurrency(spent)}). Excelente disciplina.`
            })
          }
        })
      }

      // === 4. OBJETIVOS DE AHORRO (8 recomendaciones) ===
      if (!goals || goals.length === 0) {
        recs.push({
          id: id++, type: 'tip', category: 'Objetivos', priority: 63,
          title: 'Define metas SMART',
          description: 'Crea objetivos específicos, medibles y con fecha límite. Ejemplo: ahorrar ₲10M en 6 meses.'
        })
      } else {
        goals.forEach(goal => {
          const progress = (goal.current_amount / goal.target_amount) * 100
          const remaining = goal.target_amount - goal.current_amount
          const daysLeft = goal.target_date ? Math.ceil((new Date(goal.target_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0
          const monthlyNeeded = daysLeft > 0 ? remaining / (daysLeft / 30) : 0
          
          if (progress >= 100) {
            recs.push({
              id: id++, type: 'success', category: 'Objetivos', priority: 92,
              title: `🎉 ¡Objetivo alcanzado!`,
              description: `Completaste "${goal.name}". Define un nuevo objetivo para seguir creciendo.`
            })
          } else if (daysLeft < 30 && progress < 80) {
            recs.push({
              id: id++, type: 'urgent', category: 'Objetivos', priority: 87,
              title: `Objetivo en riesgo: "${goal.name}"`,
              description: `${progress.toFixed(0)}% completado, quedan ${daysLeft} días. Necesitas ${formatCurrency(monthlyNeeded)}/mes.`
            })
          } else if (progress > 75) {
            recs.push({
              id: id++, type: 'success', category: 'Objetivos', priority: 52,
              title: `Cerca de la meta: "${goal.name}"`,
              description: `${progress.toFixed(0)}% completado. Faltan ${formatCurrency(remaining)}.`
            })
          }
        })
      }

      // === 5. SUSCRIPCIONES Y GASTOS RECURRENTES (7 recomendaciones) ===
      if (subscriptions && subscriptions.length > 0) {
        const totalSubscriptions = subscriptions.reduce((s, sub) => s + Number(sub.amount), 0)
        const subscriptionPct = currentIncome > 0 ? (totalSubscriptions / currentIncome) * 100 : 0
        
        if (subscriptionPct > 15) {
          recs.push({
            id: id++, type: 'warning', category: 'Suscripciones', priority: 72,
            title: 'Muchas suscripciones',
            description: `${formatCurrency(totalSubscriptions)}/mes (${subscriptionPct.toFixed(1)}% de ingresos). Revisa cuáles realmente usas.`
          })
        }

        subscriptions.forEach(sub => {
          const nextPayment = new Date(sub.next_payment_date)
          const daysUntil = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysUntil <= 3 && daysUntil >= 0) {
            recs.push({
              id: id++, type: 'info', category: 'Suscripciones', priority: 68,
              title: `Próximo pago: ${sub.name}`,
              description: `${formatCurrency(sub.amount)} en ${daysUntil} día(s). Verifica que tengas fondos.`
            })
          }
        })
      }

      // === 6. TARJETAS Y DEUDAS (6 recomendaciones) ===
      if (cards && cards.length > 0) {
        cards.forEach(card => {
          const usage = (card.current_balance / card.credit_limit) * 100
          
          if (usage > 80) {
            recs.push({
              id: id++, type: 'urgent', category: 'Tarjetas', priority: 89,
              title: `🚨 Tarjeta al límite: ${card.name}`,
              description: `Usaste ${usage.toFixed(0)}% del límite. Evita sobregiros y paga pronto.`
            })
          } else if (usage > 50) {
            recs.push({
              id: id++, type: 'warning', category: 'Tarjetas', priority: 71,
              title: `Alto uso de crédito: ${card.name}`,
              description: `Usaste ${usage.toFixed(0)}% (${formatCurrency(card.current_balance)}). Recomendado: <30%.`
            })
          }

          const daysUntilDue = Math.ceil((new Date(card.payment_due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          if (daysUntilDue <= 5 && daysUntilDue >= 0 && card.current_balance > 0) {
            recs.push({
              id: id++, type: 'warning', category: 'Tarjetas', priority: 84,
              title: `Vencimiento próximo: ${card.name}`,
              description: `Pago de ${formatCurrency(card.minimum_payment)} en ${daysUntilDue} días. Evita intereses.`
            })
          }
        })
      }

      // === 7. FACTURACIÓN E INGRESOS (5 recomendaciones) ===
      if (invoices && invoices.length > 0) {
        const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue')
        const overdueInvoices = invoices.filter(inv => inv.status === 'overdue')
        const totalPending = pendingInvoices.reduce((s, inv) => s + Number(inv.amount), 0)
        
        if (overdueInvoices.length > 0) {
          const totalOverdue = overdueInvoices.reduce((s, inv) => s + Number(inv.amount), 0)
          recs.push({
            id: id++, type: 'urgent', category: 'Facturación', priority: 94,
            title: `${overdueInvoices.length} facturas vencidas`,
            description: `${formatCurrency(totalOverdue)} por cobrar. Contacta a tus clientes urgentemente.`
          })
        } else if (pendingInvoices.length > 0) {
          recs.push({
            id: id++, type: 'info', category: 'Facturación', priority: 66,
            title: `${pendingInvoices.length} facturas pendientes`,
            description: `${formatCurrency(totalPending)} por cobrar. Haz seguimiento a tus clientes.`
          })
        }

        const paidThisMonth = invoices.filter(inv => 
          inv.status === 'paid' && 
          inv.paid_date && 
          inv.paid_date.startsWith(currentMonth)
        )
        
        if (paidThisMonth.length === 0 && invoices.length > 3) {
          recs.push({
            id: id++, type: 'warning', category: 'Facturación', priority: 77,
            title: 'Sin cobros este mes',
            description: 'No has recibido pagos de facturas este mes. Revisa tu flujo de caja.'
          })
        }
      }

      // === 8. TIPS GENERALES Y ESTRATEGIAS (20 recomendaciones) ===
      const generalTips = [
        { type: 'tip' as const, category: 'Estrategia', title: 'Regla 50/30/20', description: '50% necesidades, 30% deseos, 20% ahorro/inversión. Ajusta tu distribución actual.', priority: 35 },
        { type: 'tip' as const, category: 'Ahorro', title: 'Automatiza tus ahorros', description: 'Programa transferencias automáticas el día de cobro. "Págat a ti primero".', priority: 48 },
        { type: 'info' as const, category: 'Inversión', title: 'Diversifica inversiones', description: 'No pongas todos los huevos en una canasta. Considera bonos, acciones, fondos.', priority: 32 },
        { type: 'tip' as const, category: 'Deuda', title: 'Método avalancha para deudas', description: 'Paga primero deudas con mayor interés. Ahorra en intereses a largo plazo.', priority: 58 },
        { type: 'info' as const, category: 'Impuestos', title: 'Optimiza tu carga tributaria', description: 'Revisa deducciones permitidas. Considera asesoría contable profesional.', priority: 44 },
        { type: 'tip' as const, category: 'Gastos', title: 'Regla de las 24 horas', description: 'Espera 24h antes de compras no esenciales >₲500k. Evita compras impulsivas.', priority: 36 },
        { type: 'tip' as const, category: 'Ingresos', title: 'Diversifica fuentes de ingreso', description: 'No dependas de una sola fuente. Freelancing, inversiones pasivas, negocios.', priority: 62 },
        { type: 'info' as const, category: 'Educación', title: 'Invierte en ti mismo', description: 'Cursos, libros, certificaciones aumentan tu valor en el mercado.', priority: 41 },
        { type: 'tip' as const, category: 'Negociación', title: 'Negocia tus servicios', description: 'Revisa precios de suscripciones, seguros, servicios. Ahorra 10-20% anual.', priority: 54 },
        { type: 'info' as const, category: 'Retiro', title: 'Planifica tu jubilación', description: 'Empieza hoy. Interés compuesto: ₲1M/mes por 30 años = ₲1,000M+ a 8% anual.', priority: 33 },
        { type: 'tip' as const, category: 'Seguros', title: 'Protege tus ingresos', description: 'Seguro de vida, salud, incapacidad. Protege a tu familia ante imprevistos.', priority: 47 },
        { type: 'info' as const, category: 'Patrimonio', title: 'Calcula tu patrimonio neto', description: 'Activos - Pasivos = Patrimonio. Revisa trimestralmente. Meta: crecimiento >10%/año.', priority: 39 },
        { type: 'tip' as const, category: 'Comportamiento', title: 'Evita inflación de estilo de vida', description: 'Cuando aumenten ingresos, ahorra el incremento en vez de gastar más.', priority: 56 },
        { type: 'info' as const, category: 'Metas', title: 'Método SMART para objetivos', description: 'Específico, Medible, Alcanzable, Relevante, con Tiempo definido.', priority: 43 },
        { type: 'tip' as const, category: 'Compras', title: 'Compara precios siempre', description: 'Usa apps de comparación. 3 cotizaciones mínimo en compras >₲1M.', priority: 37 },
        { type: 'info' as const, category: 'Emergencias', title: 'Plan B financiero', description: 'Qué harías si pierdes tu ingreso principal? Ten plan de acción.', priority: 51 },
        { type: 'tip' as const, category: 'Análisis', title: 'Revisa finanzas semanalmente', description: '15 minutos/semana para revisar transacciones. Detecta problemas temprano.', priority: 59 },
        { type: 'info' as const, category: 'Inflación', title: 'Invierte contra inflación', description: 'Guardar efectivo pierde valor. Inversiones que superen inflación (6-8%/año).', priority: 34 },
        { type: 'tip' as const, category: 'Tecnología', title: 'Usa apps de ahorro', description: 'Redondeo automático, cashback, descuentos. Pequeños ahorros suman.', priority: 29 },
        { type: 'info' as const, category: 'Mentalidad', title: 'Piensa a largo plazo', description: 'Riqueza = consistencia + tiempo. Pequeñas decisiones diarias importan.', priority: 31 },
      ]

      generalTips.forEach(tip => {
        if (recs.length < 80) {
          recs.push({ ...tip, id: id++ })
        }
      })

      // Ordenar por prioridad y limitar a top 60
      return recs
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 60)
    },
  })

  const getIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'success': return <CheckCircle className="h-4 w-4" />
      case 'tip': return <Lightbulb className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'urgent': return 'destructive'
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
            Recomendaciones Financieras Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Analizando tu situación financiera...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Recomendaciones Financieras Inteligentes
          </span>
          <Badge variant="secondary">{recommendations?.length || 0} insights</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
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
