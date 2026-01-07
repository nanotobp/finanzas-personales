import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/components/dashboard/dashboard-stats-optimized'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
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

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-6 w-1/3 mb-4" />
          <Skeleton className="h-[300px] w-full" />
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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  console.log('Dashboard User ID:', user.id)

  // Obtener stats del dashboard en el server
  const currentMonth = new Date().toISOString().slice(0, 7)
  const startDate = `${currentMonth}-01`
  const year = parseInt(currentMonth.split('-')[0])
  const month = parseInt(currentMonth.split('-')[1])
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${currentMonth}-${String(lastDay).padStart(2, '0')}`

  console.log('Date Range:', { startDate, endDate })

  // Consultas server-side
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
      .select('amount, status, paid_date')
      .eq('status', 'paid')
      .not('paid_date', 'is', null)
      .gte('paid_date', startDate)
      .lte('paid_date', endDate)
  ])

  const transactions = transactionsResult.data || []
  const accounts = accountsResult.data || []
  const paidInvoices = invoicesResult.data || []

  console.log('Dashboard Stats Debug:', {
    month: currentMonth,
    transactionsCount: transactions.length,
    paidInvoicesCount: paidInvoices.length,
    accountsCount: accounts.length,
    invoicesError: invoicesResult.error,
    sampleInvoice: paidInvoices[0]
  })

  // Ingresos: SOLO de transactions (otros ingresos varios)
  // Las facturas pagadas YA NO se cuentan aquí porque se muestran en /income
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
  // Sumar facturas pagadas como ingresos
  const invoiceIncome = paidInvoices.reduce((sum, inv) => sum + (typeof inv.amount === 'string' ? parseFloat(inv.amount) : Number(inv.amount)), 0)
  const finalIncome = totalIncome + invoiceIncome
  
  console.log('Income Calculation:', {
    transactionsIncome: totalIncome,
    invoiceIncome,
    finalIncome
  })
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

  const stats = {
    income: finalIncome,
    expenses: totalExpenses,
    balance: totalBalance,
    net: finalIncome - totalExpenses,
    balanceChange: 3.12,
    incomeChange: 2.84,
    expensesChange: -4.78,
    netChange: 1.98,
  }

  return (
    <div className="py-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Resumen general de tus finanzas
          </p>
        </div>
      </div>

      {/* Metric cards - 1 column on xs, 2 columns on lg */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-1 lg:grid-cols-2">
        <Suspense fallback={<StatsSkeleton />}>
          <DashboardStats stats={stats} />
        </Suspense>
        <div className="lg:col-span-1">
          <FinancialRecommendations />
        </div>
      </div>

      {/* Client Invoices and SMART Goals - 1 column on mobile, 4 column grid on lg */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <ClientInvoicesDue />
        </div>
        <div className="lg:col-span-1">
          <SmartGoalsSummary />
        </div>
      </div>

      {/* Charts and Budgets - 1 column on mobile, 2 on tablet, 4 on desktop */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2">
          <IncomeExpensesChart />
        </div>
        <div className="md:col-span-1">
          <MonthlyBudgetsCard />
        </div>
        <div className="md:col-span-1">
          <Suspense fallback={<TransactionsSkeleton />}>
            <UpcomingSubscriptions userId={user.id} />
          </Suspense>
        </div>
      </div>

      {/* Weekly Expenses and IVA - 2 columns */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
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

export const revalidate = 180
