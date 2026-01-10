'use client'

import { Suspense } from 'react'
import { HomeClean } from '@/components/dashboard/home-clean'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { DashboardStats } from '@/components/dashboard/dashboard-stats-optimized'
import { RecentTransactions } from '@/components/dashboard/recent-transactions-optimized'
import { UpcomingSubscriptions } from '@/components/dashboard/upcoming-subscriptions'
import { SmartGoalsSummary } from '@/components/dashboard/smart-goals-summary'
import { ClientInvoicesDue } from '@/components/dashboard/client-invoices-due'
import { IncomeExpensesChart } from '@/components/dashboard/income-expenses-chart'
import { WeeklyExpenses } from '@/components/dashboard/weekly-expenses'
import { MonthlyBudgetsCard } from '@/components/dashboard/monthly-budgets-card'
import { FinancialRecommendations } from '@/components/dashboard/financial-recommendations'
import { IVAPayableCard } from '@/components/dashboard/iva-payable-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

function StatsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-6 h-[180px]">
          <Skeleton className="h-4 w-1/3 mb-4" />
          <Skeleton className="h-10 w-2/3 mb-2" />
          <Skeleton className="h-4 w-full" />
        </Card>
      ))}
    </div>
  )
}

function TransactionsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-6 w-1/3 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, j) => (
              <Skeleton key={j} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

function DashboardDesktop() {
  const supabase = createClient()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', currentMonth],
    queryFn: async () => {
      const startDate = `${currentMonth}-01`
      const year = parseInt(currentMonth.split('-')[0])
      const month = parseInt(currentMonth.split('-')[1])
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${currentMonth}-${String(lastDay).padStart(2, '0')}`

      const [transactionsResult, accountsResult, invoicesResult] = await Promise.all([
        supabase.from('transactions').select('amount, type').gte('date', startDate).lte('date', endDate),
        supabase.from('accounts').select('balance').eq('is_active', true),
        supabase.from('invoices').select('amount, status, paid_date').eq('status', 'paid').not('paid_date', 'is', null).gte('paid_date', startDate).lte('paid_date', endDate)
      ])

      const transactions = transactionsResult.data || []
      const accounts = accountsResult.data || []
      const paidInvoices = invoicesResult.data || []

      const { totalIncome, totalExpenses } = transactions.reduce(
        (acc, t) => {
          const amount = Number(t.amount)
          if (t.type === 'income') acc.totalIncome += amount
          else if (t.type === 'expense') acc.totalExpenses += amount
          return acc
        },
        { totalIncome: 0, totalExpenses: 0 }
      )

      const invoiceIncome = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
      const finalIncome = totalIncome + invoiceIncome
      const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

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
  })

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser()
      return data
    },
  })

  return (
    <div className="space-y-8">
      {/* Header mejorado */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Bienvenido de vuelta, {userData?.user?.email?.split('@')[0] || 'Usuario'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6">
        <Suspense fallback={<StatsSkeleton />}>
          {stats && <DashboardStats stats={stats} />}
        </Suspense>
      </div>

      {/* Financial Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IncomeExpensesChart />
        </div>
        <div className="lg:col-span-1">
          <FinancialRecommendations />
        </div>
      </div>

      {/* Invoices and Goals */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <ClientInvoicesDue />
        </div>
        <div className="lg:col-span-1">
          <SmartGoalsSummary />
        </div>
      </div>

      {/* Budgets and Subscriptions */}
      <div className="grid gap-6 md:grid-cols-2">
        <MonthlyBudgetsCard />
        <Suspense fallback={<TransactionsSkeleton />}>
          {userData?.user && <UpcomingSubscriptions userId={userData.user.id} />}
        </Suspense>
      </div>

      {/* Weekly and Taxes */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyExpenses />
        </div>
        <div className="lg:col-span-1">
          <IVAPayableCard />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <HomeClean />
  }

  return <DashboardDesktop />
}
