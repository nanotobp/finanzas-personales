'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SavingsRateGauge() {
  const supabase = createClient()

  const { data: savingsData } = useQuery({
    queryKey: ['savings-rate'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // Últimos 30 días
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const [transactionsResult, invoicesResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('type, amount')
          .eq('user_id', user.id)
          .gte('date', startDate.toISOString().split('T')[0]),
        supabase
          .from('invoices')
          .select('amount')
          .eq('user_id', user.id)
          .eq('status', 'paid')
          .not('paid_date', 'is', null)
      ])

      if (transactionsResult.error) throw transactionsResult.error
      const transactions = transactionsResult.data || []
      const invoices = invoicesResult.data || []

      const transactionIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      
      const invoiceIncome = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
      const income = transactionIncome + invoiceIncome

      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0

      return {
        income,
        expenses,
        savings: income - expenses,
        savingsRate: Math.max(0, Math.min(100, savingsRate))
      }
    }
  })

  const rate = savingsData?.savingsRate || 0
  const getColor = () => {
    if (rate >= 50) return 'text-green-600'
    if (rate >= 30) return 'text-blue-600'
    if (rate >= 20) return 'text-yellow-600'
    if (rate >= 10) return 'text-orange-600'
    return 'text-red-600'
  }

  const getGaugeColor = () => {
    if (rate >= 50) return 'from-green-500 to-emerald-600'
    if (rate >= 30) return 'from-blue-500 to-indigo-600'
    if (rate >= 20) return 'from-yellow-500 to-amber-600'
    if (rate >= 10) return 'from-orange-500 to-red-500'
    return 'from-red-600 to-rose-700'
  }

  const getMessage = () => {
    if (rate >= 50) return '¡Excelente! Tasa de ahorro muy saludable'
    if (rate >= 30) return 'Muy bien, sigue así'
    if (rate >= 20) return 'Aceptable, puedes mejorar'
    if (rate >= 10) return 'Bajo, intenta aumentar tus ahorros'
    return 'Crítico, revisa tus gastos'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Tasa de Ahorro
        </CardTitle>
        <CardDescription>Últimos 30 días</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Gauge Visual */}
          <div className="relative flex items-center justify-center">
            <svg width="200" height="120" viewBox="0 0 200 120" className="overflow-visible">
              {/* Background arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Progress arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(rate / 100) * 251.2} 251.2`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" className={cn('transition-colors', getGaugeColor().split(' ')[0].replace('from-', 'stop-'))} />
                  <stop offset="100%" className={cn('transition-colors', getGaugeColor().split(' ')[1].replace('to-', 'stop-'))} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute top-16 text-center">
              <div className={cn('text-4xl font-bold', getColor())}>
                {rate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {getMessage()}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ingresos</p>
              <p className="text-sm font-semibold text-green-600">
                Gs {((savingsData?.income || 0) / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Gastos</p>
              <p className="text-sm font-semibold text-red-600">
                Gs {((savingsData?.expenses || 0) / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ahorro</p>
              <p className={cn('text-sm font-semibold', getColor())}>
                Gs {((savingsData?.savings || 0) / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
