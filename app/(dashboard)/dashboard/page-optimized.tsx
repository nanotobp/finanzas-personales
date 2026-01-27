import { Suspense } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { DashboardStats } from '@/components/dashboard/dashboard-stats-optimized'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts-optimized'
import { RecentTransactions } from '@/components/dashboard/recent-transactions-optimized'
import { UpcomingSubscriptions } from '@/components/dashboard/upcoming-subscriptions'
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

export default function DashboardPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <StatsSkeleton />
  }

  if (!user) return null

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Resumen general de tus finanzas
          </p>
        </div>
      </div>

      {/* Stats con Suspense */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats stats={{ income: 0, expenses: 0, balance: 0, net: 0, balanceChange: 0, incomeChange: 0, expensesChange: 0, netChange: 0 }} />
      </Suspense>

      {/* Charts con Suspense */}
      <Suspense fallback={<ChartsSkeleton />}>
        <DashboardCharts userId={user.id} />
      </Suspense>

      {/* Transactions con Suspense */}
      <Suspense fallback={<TransactionsSkeleton />}>
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentTransactions userId={user.id} />
          <UpcomingSubscriptions userId={user.id} />
        </div>
      </Suspense>
    </div>
  )
}
