'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Target, TrendingUp, Calendar, Flag } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Goal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string
  priority: number
  progress_percentage: number
}

export function GoalsMobile() {
  const supabase = createClient()

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals-mobile'],
    queryFn: async (): Promise<Goal[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false })

      if (!data) return []

      return data.map(goal => ({
        ...goal,
        progress_percentage: Number(goal.current_amount) / Number(goal.target_amount) * 100
      }))
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 pt-6 pb-24">
        <div className="max-w-md mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const getDaysRemaining = (targetDate: string) => {
    const days = Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return { bg: 'bg-rose-500', text: 'text-rose-500', ring: 'ring-rose-500/20' }
    if (priority >= 3) return { bg: 'bg-amber-500', text: 'text-amber-500', ring: 'ring-amber-500/20' }
    return { bg: 'bg-blue-500', text: 'text-blue-500', ring: 'ring-blue-500/20' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 pt-6 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Objetivos SMART</h1>
          <p className="text-sm text-slate-600 mt-1">
            {goals?.length || 0} {goals?.length === 1 ? 'objetivo activo' : 'objetivos activos'}
          </p>
        </div>

        {/* Goals List */}
        {goals && goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal) => {
              const colors = getPriorityColor(goal.priority)
              const daysLeft = getDaysRemaining(goal.target_date)
              
              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">{goal.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Flag className={`w-3 h-3 ${colors.text}`} />
                        <span>Prioridad {goal.priority}/5</span>
                      </div>
                    </div>
                    <div className={`h-10 w-10 rounded-xl ${colors.bg}/10 flex items-center justify-center ring-1 ${colors.ring}`}>
                      <Target className={`h-5 w-5 ${colors.text}`} />
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-600">Progreso</span>
                      <span className="text-xs font-semibold text-slate-900">
                        {goal.progress_percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${colors.bg}`}
                        style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-slate-600">Actual</p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(goal.current_amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600">Meta</p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(goal.target_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-600">
                      {daysLeft > 0 ? `${daysLeft} días restantes` : 'Vencido'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-dashed">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-slate-900 font-semibold mb-2">Sin objetivos</h3>
            <p className="text-sm text-slate-600 mb-4">
              Define objetivos SMART para alcanzar tus metas financieras
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
