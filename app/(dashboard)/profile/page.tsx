'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Activity, TrendingUp, TrendingDown, PiggyBank, LogOut, AlertTriangle, DollarSign } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)

  const { data: healthData, isLoading } = useQuery({
    queryKey: ['financial-health-profile', currentMonth],
    queryFn: async () => {
      const startDate = `${currentMonth}-01`
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
        .toISOString().split('T')[0]

      const lastMonthStart = `${lastMonth}-01`
      const lastMonthEnd = new Date(new Date(lastMonthStart).getFullYear(), new Date(lastMonthStart).getMonth() + 1, 0)
        .toISOString().split('T')[0]

      const [accountsRes, transactionsRes, lastMonthTransactionsRes, budgetsRes] = await Promise.all([
        supabase.from('accounts').select('balance').eq('is_active', true),
        supabase.from('transactions').select('amount, type').gte('date', startDate).lte('date', endDate),
        supabase.from('transactions').select('amount, type').gte('date', lastMonthStart).lte('date', lastMonthEnd),
        supabase.from('budgets').select('amount, category_id').eq('month', currentMonth)
      ])

      const totalBalance = accountsRes.data?.reduce((sum, a) => sum + Number(a.balance), 0) || 0
      
      const currentIncome = transactionsRes.data?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const currentExpenses = transactionsRes.data?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0
      
      const lastIncome = lastMonthTransactionsRes.data?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const lastExpenses = lastMonthTransactionsRes.data?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0

      const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0
      const totalBudget = budgetsRes.data?.reduce((sum, b) => sum + Number(b.amount), 0) || 0
      const budgetUsage = totalBudget > 0 ? (currentExpenses / totalBudget) * 100 : 0

      // Calcular score de salud financiera (0-100)
      let healthScore = 0
      if (totalBalance > 0) healthScore += 25
      if (savingsRate > 20) healthScore += 25
      else if (savingsRate > 10) healthScore += 15
      else if (savingsRate > 0) healthScore += 10
      
      if (budgetUsage < 80) healthScore += 25
      else if (budgetUsage < 100) healthScore += 15
      
      if (currentExpenses < lastExpenses) healthScore += 25
      else if (currentExpenses <= lastExpenses * 1.1) healthScore += 15

      return {
        totalBalance,
        currentIncome,
        currentExpenses,
        savingsRate,
        budgetUsage,
        healthScore: Math.round(healthScore),
        incomeChange: lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0,
        expensesChange: lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0
      }
    },
  })

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 pt-6 pb-24">
        <div className="max-w-md mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return { bg: 'from-emerald-600 to-emerald-500', text: 'text-emerald-500', label: 'Excelente' }
    if (score >= 60) return { bg: 'from-blue-600 to-blue-500', text: 'text-blue-500', label: 'Buena' }
    if (score >= 40) return { bg: 'from-amber-600 to-amber-500', text: 'text-amber-500', label: 'Regular' }
    return { bg: 'from-rose-600 to-rose-500', text: 'text-rose-500', label: 'Necesita atención' }
  }

  const healthColor = getHealthColor(healthData?.healthScore || 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 pt-6 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
          <p className="text-sm text-slate-600 mt-1">Salud financiera y estado de tu cuenta</p>
        </div>

        {/* Score principal */}
        <div className={`bg-gradient-to-br ${healthColor.bg} rounded-2xl p-5 shadow-lg`}>
          <div className="flex items-center gap-4 mb-3">
            <Activity className="w-10 h-10 text-white" />
            <div className="flex-1">
              <p className="text-white/90 text-xs mb-1">Salud Financiera</p>
              <h2 className="text-4xl font-bold text-white">{healthData?.healthScore || 0}</h2>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-1000"
              style={{ width: `${healthData?.healthScore || 0}%` }}
            />
          </div>
          <p className="text-white font-medium text-sm mt-3">{healthColor.label}</p>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-2 gap-3">
          {/* Balance */}
          <div className="bg-white rounded-2xl p-4 border shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <p className="text-xs text-slate-600">Balance</p>
            </div>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(healthData?.totalBalance || 0)}</p>
          </div>

          {/* Tasa de ahorro */}
          <div className="bg-white rounded-2xl p-4 border shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-5 h-5 text-blue-500" />
              <p className="text-xs text-slate-600">Ahorro</p>
            </div>
            <p className="text-xl font-bold text-slate-900">{healthData?.savingsRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Ingresos vs Gastos */}
        <div>
          <h3 className="text-base font-semibold mb-3 text-slate-900">Este mes</h3>
          <div className="space-y-3">
            {/* Ingresos */}
            <div className="bg-white rounded-2xl p-4 border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-700">Ingresos</span>
                </div>
                <span className={`text-xs font-medium ${healthData?.incomeChange && healthData.incomeChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {healthData?.incomeChange && healthData.incomeChange > 0 ? '+' : ''}{healthData?.incomeChange.toFixed(1)}%
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(healthData?.currentIncome || 0)}</p>
            </div>

            {/* Gastos */}
            <div className="bg-white rounded-2xl p-4 border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                  <span className="text-slate-700">Gastos</span>
                </div>
                <span className={`text-xs font-medium ${healthData?.expensesChange && healthData.expensesChange < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {healthData?.expensesChange && healthData.expensesChange > 0 ? '+' : ''}{healthData?.expensesChange.toFixed(1)}%
                </span>
              </div>
              <p className="text-2xl font-bold text-rose-600">{formatCurrency(healthData?.currentExpenses || 0)}</p>
            </div>
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-900">
            <AlertTriangle className="w-5 h-5" />
            Recomendaciones
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            {healthData?.savingsRate && healthData.savingsRate < 10 && (
              <li className="flex gap-2">
                <span>•</span>
                <span>Intenta ahorrar al menos el 10% de tus ingresos</span>
              </li>
            )}
            {healthData?.budgetUsage && healthData.budgetUsage > 90 && (
              <li className="flex gap-2">
                <span>•</span>
                <span>Estás cerca del límite de tu presupuesto. Controla tus gastos</span>
              </li>
            )}
            {healthData?.expensesChange && healthData.expensesChange > 10 && (
              <li className="flex gap-2">
                <span>•</span>
                <span>Tus gastos han aumentado este mes. Revisa dónde puedes reducir</span>
              </li>
            )}
            {healthData?.healthScore && healthData.healthScore >= 80 && (
              <li className="flex gap-2">
                <span>•</span>
                <span>¡Excelente! Mantén estos buenos hábitos financieros</span>
              </li>
            )}
          </ul>
        </div>

        {/* Botón de cerrar sesión */}
        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          variant="outline"
          className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </Button>
      </div>
    </div>
  )
}
