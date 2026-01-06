import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/components/dashboard/dashboard-stats-optimized'
import { RecentTransactions } from '@/components/dashboard/recent-transactions-optimized'
import { UpcomingSubscriptions } from '@/components/dashboard/upcoming-subscriptions'
import { SmartGoalsSummary } from '@/components/dashboard/smart-goals-summary'
import { ClientInvoicesDue } from '@/components/dashboard/client-invoices-due'
import { IncomeExpensesChart } from '@/components/dashboard/income-expenses-chart'
import { WeeklyExpenses } from '@/components/dashboard/weekly-expenses'
import { MonthlyBudgetsCard } from '@/components/dashboard/monthly-budgets-card'
import { FinancialRecommendations } from '@/components/dashboard/financial-recommendations'
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
          <DashboardStats userId={user.id} />
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

      {/* Weekly Expenses - full width */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1">
        <WeeklyExpenses />
      </div>
    </div>
  )
}

export const revalidate = 180
