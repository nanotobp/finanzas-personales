'use client'

import { useMemo, memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardStatsProps {
  userId: string
}

// Componente MiniChart memoizado
const MiniChart = memo(({ heights, isPositive }: { heights: number[], isPositive: boolean }) => (
  <div className="h-16 mt-2 flex items-end gap-1">
    {heights.map((height, idx) => (
      <div
        key={idx}
        className={cn(
          'flex-1 rounded-sm transition-all hover:opacity-80',
          isPositive ? 'bg-emerald-600/80' : 'bg-red-600/80'
        )}
        style={{ height: `${height}%` }}
      />
    ))}
  </div>
))
MiniChart.displayName = 'MiniChart'

export const DashboardStats = memo(function DashboardStats({ userId }: DashboardStatsProps) {
      // Logs de depuración en el cliente
      import { useEffect } from 'react'
      useEffect(() => {
        if (typeof window !== 'undefined') {
          console.log('DashboardStats userId:', userId)
          // El valor de stats puede ser undefined al inicio
          console.log('DashboardStats stats:', stats)
        }
      }, [userId, stats])
    // DEBUG: log userId y stats
    if (typeof window !== 'undefined') {
      console.log('DashboardStats userId:', userId)
    }
  const supabase = createClient()
  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), [])

  const { data: stats } = useQuery({
      // DEBUG: log stats
      if (typeof window !== 'undefined') {
        console.log('DashboardStats stats:', stats)
      }
    queryKey: ['dashboard-stats', currentMonth],
    queryFn: async () => {
      const startDate = `${currentMonth}-01`
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
        .toISOString().split('T')[0]

      // Optimización: Una sola query con todos los datos
      const [transactionsResult, accountsResult, invoicesResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('amount, type')
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('accounts')
          .select('balance')
          .eq('is_active', true),
        supabase
          .from('invoices')
          .select('amount, status, issue_date')
          .gte('issue_date', startDate)
          .lte('issue_date', endDate)
          .eq('status', 'paid')
      ])

      const transactions = transactionsResult.data || []
      const accounts = accountsResult.data || []
      const paidInvoices = invoicesResult.data || []

      // Calcular en una sola pasada
      const { totalIncome, totalExpenses } = transactions.reduce(
        (acc, t) => {
          const amount = Number(t.amount)
          if (t.type === 'income') {
            acc.totalIncome += amount
          } else if (t.type === 'expense') {
            acc.totalExpenses += amount
          }
          return acc
        },
        { totalIncome: 0, totalExpenses: 0 }
      )

      // Sumar ingresos de facturas cobradas
      const invoiceIncome = paidInvoices.reduce((sum, inv) => sum + (typeof inv.amount === 'string' ? parseFloat(inv.amount) : Number(inv.amount)), 0)
      const finalIncome = totalIncome + invoiceIncome

      const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

      // Calculate percentage changes (mock data for demo)
      return {
        income: finalIncome,
        expenses: totalExpenses,
        balance: totalBalance,
        net: finalIncome - totalExpenses,
        balanceChange: 3.12,
        incomeChange: 2.84,
        expensesChange: -4.78,
        netChange: 1.98,
      }
    },
    staleTime: 0, // Sin cache, siempre datos frescos
    gcTime: 10 * 60 * 1000,
  })

  const statCards = useMemo(() => [
    {
      title: 'Saldo Total',
      value: stats?.balance || 0,
      change: stats?.balanceChange || 0,
      lastMonth: formatCurrency((stats?.balance || 0) * 0.93),
      color: 'emerald',
    },
    {
      title: 'Ingresos del Mes',
      value: stats?.income || 0,
      change: stats?.incomeChange || 0,
      lastMonth: formatCurrency((stats?.income || 0) * 0.95),
      color: 'emerald',
      extra: (
        <span className="block text-xs text-muted-foreground mt-1">
          Incluye facturas cobradas
        </span>
      ),
    },
    {
      title: 'Gastos del Mes',
      value: stats?.expenses || 0,
      change: stats?.expensesChange || 0,
      lastMonth: formatCurrency((stats?.expenses || 0) * 1.05),
      color: 'red',
    },
    {
      title: 'Balance Neto',
      value: stats?.net || 0,
      change: stats?.netChange || 0,
      lastMonth: formatCurrency((stats?.net || 0) * 0.98),
      color: (stats?.net || 0) >= 0 ? 'emerald' : 'red',
    },
  ], [stats])

  // Datos para mini charts (memoizados)
  const miniChartData = useMemo(() =>
    [40, 60, 45, 70, 85, 75, 90, 100, 80, 65, 75, 85],
    []
  )

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
      {statCards.map((stat) => {
        const isPositive = stat.change > 0
        return (
          <Card key={stat.title} className="p-6 h-[180px] flex flex-col">
            <div className="flex flex-col h-full">
              <div className="space-y-2 mb-auto">
                <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                <div className="text-3xl font-bold">{formatCurrency(stat.value)}</div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={cn(
                    'flex items-center gap-1',
                    isPositive ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {isPositive ? (
                      <ArrowUpIcon className="h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4" />
                    )}
                    <span className="font-medium">{Math.abs(stat.change)}%</span>
                  </div>
                  <span className="text-muted-foreground">Mes anterior {stat.lastMonth}</span>
                </div>
              </div>
              <MiniChart heights={miniChartData} isPositive={isPositive} />
            </div>
          </Card>
        )
      })}
    </div>
  )
})
