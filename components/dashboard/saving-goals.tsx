'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PiggyBank } from 'lucide-react'

const colors = [
  { color: 'rgb(255, 99, 132)', lightColor: 'rgba(255, 99, 132, 0.2)' },
  { color: 'rgb(75, 192, 112)', lightColor: 'rgba(75, 192, 112, 0.2)' },
  { color: 'rgb(66, 153, 225)', lightColor: 'rgba(66, 153, 225, 0.2)' },
  { color: 'rgb(251, 191, 36)', lightColor: 'rgba(251, 191, 36, 0.2)' },
]

interface CircularProgressProps {
  value: number
  color: string
  lightColor: string
  size?: number
}

function CircularProgress({ value, color, lightColor, size = 130 }: CircularProgressProps) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="absolute bg-card rounded-full" width={size} height={size}>
        <circle
          className="transition-all duration-300"
          stroke={lightColor}
          strokeWidth={strokeWidth}
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>

      {/* Progress circle */}
      <svg className="absolute -rotate-90" width={size} height={size}>
        <circle
          className="transition-all duration-300"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>

      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold" style={{ color }}>
        {value}%
      </div>
    </div>
  )
}

export function SavingGoals() {
  const supabase = createClient()

  const { data: goals, isLoading } = useQuery({
    queryKey: ['savings-goals-dashboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('savings_goals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4)

      return data?.map((goal, idx) => ({
        name: goal.name,
        progress: goal.target_amount > 0 
          ? Math.round((goal.current_amount / goal.target_amount) * 100)
          : 0,
        ...colors[idx % colors.length]
      })) || []
    },
  })

  if (isLoading) {
    return (
      <Card className="shadow-none p-0 border-0" data-testid="loading-skeleton">
        <CardHeader className="px-0">
          <CardTitle>Objetivos de Ahorro</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-2 gap-8 mt-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center gap-3">
                <Skeleton className="h-[130px] w-[130px] rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!goals || goals.length === 0) {
    return (
      <Card className="shadow-none p-0 border-0">
        <CardHeader className="px-0">
          <CardTitle>Objetivos de Ahorro</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="text-center py-8">
            <PiggyBank className="h-12 w-12 mx-auto mb-2 opacity-50 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-3">No hay objetivos registrados</p>
            <Link href="/goals">
              <Button size="sm" variant="outline">
                Crear Objetivo
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-none p-0 border-0">
      <CardHeader className="px-0 flex flex-row items-center justify-between">
        <CardTitle>Objetivos de Ahorro</CardTitle>
        <Link href="/goals">
          <Button size="sm" variant="ghost">Ver todos</Button>
        </Link>
      </CardHeader>
      <CardContent className="px-0">
        <div className="grid grid-cols-2 gap-8 mt-3">
          {goals.map((goal) => (
            <div key={goal.name} className="flex flex-col items-center gap-3">
              <CircularProgress value={goal.progress} color={goal.color} lightColor={goal.lightColor} />
              <span className="font-medium text-sm text-foreground">{goal.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
