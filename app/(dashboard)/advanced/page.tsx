import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SmartAlerts } from '@/components/dashboard/smart-alerts'
import { FinancialHealthScore } from '@/components/dashboard/financial-health-score'
import { FinancialHabits } from '@/components/habits/financial-habits'
import { GamificationDashboard } from '@/components/gamification/gamification-dashboard'
import { CashflowPredictiveAnalysis } from '@/components/analytics/cashflow-predictive-analysis'
import { BenchmarkingDashboard } from '@/components/analytics/benchmarking-dashboard'
import { NotificationsCenter } from '@/components/notifications/notifications-center'
import { AutomatedMonthlyReports } from '@/components/reports/automated-monthly-reports'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function ComponentSkeleton() {
  return (
    <Card className="p-6">
      <Skeleton className="h-6 w-1/3 mb-4" />
      <Skeleton className="h-[300px] w-full" />
    </Card>
  )
}

export default async function AdvancedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header con Notificaciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="text-4xl">📊</div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Panel Avanzado</h1>
                <p className="text-muted-foreground mt-1">
                  Gamificación, análisis predictivo, hábitos y más
                </p>
              </div>
            </div>
          </div>
        </div>
        <NotificationsCenter />
      </div>

      {/* Tabs de Navegación */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="gamification">Gamificación</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen General */}
        <TabsContent value="overview" className="space-y-6">
          {/* Alertas Inteligentes */}
          <SmartAlerts />

          {/* Score de Salud Financiera y Gamificación */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <FinancialHealthScore />
            <GamificationDashboard />
          </div>

          {/* Hábitos Financieros */}
          <FinancialHabits />

          {/* Análisis Predictivo y Benchmarking */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Suspense fallback={<ComponentSkeleton />}>
              <CashflowPredictiveAnalysis />
            </Suspense>
            <Suspense fallback={<ComponentSkeleton />}>
              <BenchmarkingDashboard />
            </Suspense>
          </div>
        </TabsContent>

        {/* Tab: Gamificación */}
        <TabsContent value="gamification" className="space-y-6">
          <div className="grid gap-6">
            <GamificationDashboard />
            <FinancialHabits />
          </div>
        </TabsContent>

        {/* Tab: Análisis */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Análisis Predictivo */}
          <Suspense fallback={<ComponentSkeleton />}>
            <CashflowPredictiveAnalysis />
          </Suspense>

          {/* Benchmarking */}
          <Suspense fallback={<ComponentSkeleton />}>
            <BenchmarkingDashboard />
          </Suspense>

          {/* Score de Salud Financiera */}
          <FinancialHealthScore />
        </TabsContent>

        {/* Tab: Reportes */}
        <TabsContent value="reports" className="space-y-6">
          <AutomatedMonthlyReports />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export const revalidate = 180
