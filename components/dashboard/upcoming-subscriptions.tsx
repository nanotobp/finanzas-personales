'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { Calendar, AlertCircle } from 'lucide-react'

interface UpcomingSubscriptionsProps {
  userId: string
}

export function UpcomingSubscriptions({ userId }: UpcomingSubscriptionsProps) {
  const supabase = createClient()

  const { data: subscriptions } = useQuery({
    queryKey: ['upcoming-subscriptions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*, categories(name, icon)')
        .eq('is_active', true)
        .order('next_billing_date', { ascending: true })
        .limit(8)

      return data || []
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suscripciones Activas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {subscriptions?.map((subscription) => {
            const daysUntil = Math.ceil(
              (new Date(subscription.next_billing_date).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
            const isUrgent = daysUntil <= 7

            return (
              <div
                key={subscription.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isUrgent ? 'bg-orange-50' : 'bg-blue-50'}`}>
                    {isUrgent ? (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    ) : (
                      <Calendar className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{subscription.name}</p>
                    <p className="text-xs text-gray-500">
                      {subscription.categories?.icon} {subscription.categories?.name} • vence en {daysUntil}{' '}
                      {daysUntil === 1 ? 'día' : 'días'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatCurrency(subscription.amount)}</p>
                  <p className="text-xs text-gray-500">{formatShortDate(subscription.next_billing_date)}</p>
                </div>
              </div>
            )
          })}
          {(!subscriptions || subscriptions.length === 0) && (
            <p className="text-center text-gray-500 py-8">
              No hay suscripciones activas
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
