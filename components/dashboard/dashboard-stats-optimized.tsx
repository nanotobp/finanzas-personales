'use client'

import { useMemo, memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

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

// Ahora recibe stats como prop
export const DashboardStats = memo(function DashboardStats({ stats }: { stats: any }) {

  const statCards = useMemo(() => [
    {
      title: 'Saldo Total',
      value: stats?.balance || 0,
      change: undefined,
      lastMonth: '—',
      color: 'emerald',
    },
    {
      title: 'Ingresos del Mes',
      value: stats?.income || 0,
      change: undefined,
      lastMonth: '—',
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
      change: undefined,
      lastMonth: '—',
      color: 'red',
    },
    {
      title: 'Balance Neto',
      value: stats?.net || 0,
      change: undefined,
      lastMonth: '—',
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
        const isPositive = stat.change && stat.change > 0
        return (
          <Card key={stat.title} className="p-6 h-[180px] flex flex-col">
            <div className="flex flex-col h-full">
              <div className="space-y-2 mb-auto">
                <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                <div className="text-3xl font-bold">{formatCurrency(stat.value)}</div>
                <div className="flex items-center gap-2 text-sm">
                  {stat.change !== undefined && (
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
                  )}
                  <span className="text-muted-foreground">Mes anterior {stat.lastMonth}</span>
                </div>
              </div>
              <MiniChart heights={miniChartData} isPositive={!!isPositive} />
            </div>
          </Card>
        )
      })}
    </div>
  )
})
