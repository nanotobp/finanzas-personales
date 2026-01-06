'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Target } from 'lucide-react'

const colors = [
  { color: 'rgb(139, 92, 246)', lightColor: 'rgba(139, 92, 246, 0.2)' }, // violet
  { color: 'rgb(236, 72, 153)', lightColor: 'rgba(236, 72, 153, 0.2)' }, // pink
  { color: 'rgb(59, 130, 246)', lightColor: 'rgba(59, 130, 246, 0.2)' }, // blue
  { color: 'rgb(245, 158, 11)', lightColor: 'rgba(245, 158, 11, 0.2)' }, // amber
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

export function SmartGoalsSummary() {
  const supabase = createClient()

  const { data: goals, isLoading } = useQuery({
    queryKey: ['smart-goals-dashboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('savings_goals')
        .select('*')
        .order('priority', { ascending: false })
        .limit(4)

      return data?.map((goal, idx) => ({
        name: goal.name,
        progress: goal.progress_percentage || 0,
        ...colors[idx % colors.length]
      })) || []
    },
  })

  if (isLoading) {
    return (
      <Card className="shadow-none p-0 border-0" data-testid="loading-skeleton">
        <CardHeader className="px-0">
          <CardTitle>Objetivos SMART</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-2 gap-8 mt-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center gap-3">
                <Skeleton className="rounded-full h-[130px] w-[130px]" />
                <Skeleton className="h-4 w-24" />
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
          <CardTitle>Objetivos SMART</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No tienes objetivos SMART aún</p>
            <Link href="/goals">
              <Button variant="outline" size="sm">
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
        <CardTitle>Objetivos SMART</CardTitle>
        <Link href="/goals">
          <Button variant="ghost" size="sm">
            Ver todos
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="px-0">
        <div className="grid grid-cols-2 gap-8 mt-3">
          {goals.map((goal, idx) => (
            <div key={idx} className="flex flex-col items-center gap-3">
              <CircularProgress
                value={Math.min(goal.progress, 100)}
                color={goal.color}
                lightColor={goal.lightColor}
              />
              <p className="text-sm font-medium text-center line-clamp-2">
                {goal.name}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
