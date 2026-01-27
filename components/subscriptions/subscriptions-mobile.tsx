'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Bell, Calendar, DollarSign, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'

interface Subscription {
  id: string
  name: string
  amount: number
  billing_cycle: 'monthly' | 'yearly' | 'weekly'
  next_billing_date: string
  category: string
  is_active: boolean
}

export function SubscriptionsMobile() {
  const supabase = createClient()
  const { userId } = useAuth()

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions-mobile', userId],
    queryFn: async (): Promise<Subscription[]> => {
      if (!userId) return []

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('next_billing_date', { ascending: true })

      return data || []
    },
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 pt-6 pb-24">
        <div className="max-w-md mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const getDaysUntil = (date: string) => {
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  const getCycleLabel = (cycle: string) => {
    const labels: Record<string, string> = {
      monthly: 'Mensual',
      yearly: 'Anual',
      weekly: 'Semanal'
    }
    return labels[cycle] || cycle
  }

  const getStatusColor = (daysUntil: number) => {
    if (daysUntil <= 3) return { bg: 'bg-rose-500', text: 'text-rose-600', bgLight: 'bg-rose-50', border: 'border-rose-200' }
    if (daysUntil <= 7) return { bg: 'bg-amber-500', text: 'text-amber-600', bgLight: 'bg-amber-50', border: 'border-amber-200' }
    return { bg: 'bg-blue-500', text: 'text-blue-600', bgLight: 'bg-blue-50', border: 'border-blue-200' }
  }

  const totalMonthly = subscriptions?.reduce((sum, sub) => {
    if (sub.billing_cycle === 'monthly') return sum + Number(sub.amount)
    if (sub.billing_cycle === 'yearly') return sum + (Number(sub.amount) / 12)
    if (sub.billing_cycle === 'weekly') return sum + (Number(sub.amount) * 4)
    return sum
  }, 0) || 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 pt-6 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vencimientos</h1>
          <p className="text-sm text-slate-600 mt-1">
            {subscriptions?.length || 0} servicios activos
          </p>
        </div>

        {/* Total Monthly */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-xs font-medium">Gasto mensual estimado</p>
              <h2 className="text-2xl font-bold text-white">{formatCurrency(totalMonthly)}</h2>
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        {subscriptions && subscriptions.length > 0 ? (
          <div className="space-y-3">
            {subscriptions.map((sub) => {
              const daysUntil = getDaysUntil(sub.next_billing_date)
              const colors = getStatusColor(daysUntil)
              
              return (
                <div
                  key={sub.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border ${colors.border}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`h-12 w-12 rounded-xl ${colors.bgLight} flex items-center justify-center`}>
                      <Bell className={`h-5 w-5 ${colors.text}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">{sub.name}</h3>
                        <span className="text-sm font-bold text-slate-900 ml-2">
                          {formatCurrency(sub.amount)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className={`px-2 py-0.5 rounded-full ${colors.bgLight} ${colors.text} font-medium`}>
                          {getCycleLabel(sub.billing_cycle)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {daysUntil === 0 && <span className="font-medium text-rose-600">Hoy</span>}
                          {daysUntil === 1 && <span className="font-medium text-rose-600">Mañana</span>}
                          {daysUntil > 1 && <span>En {daysUntil} días</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-dashed">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-slate-900 font-semibold mb-2">Sin vencimientos</h3>
            <p className="text-sm text-slate-600 mb-4">
              Agrega tus servicios para controlar los pagos recurrentes
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
