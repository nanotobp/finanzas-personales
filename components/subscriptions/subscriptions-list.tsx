'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { Repeat, AlertCircle, CheckCircle, Plus, Pencil, Trash2 } from 'lucide-react'
import { SubscriptionFormDialog } from './subscription-form-dialog'
import { useAuth } from '@/hooks/use-auth'

export function SubscriptionsList() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { userId } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', userId] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions-mobile', userId] })
    },
  })

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data } = await supabase
        .from('subscriptions')
        .select('*, categories(name, icon)')
        .eq('user_id', userId)
        .order('next_billing_date', { ascending: true })

      return data || []
    },
    staleTime: 3 * 60 * 1000, // Cache por 3 minutos
    enabled: !!userId,
  })

  const totalMonthly = subscriptions
    ?.filter(s => s.is_active && s.billing_cycle === 'monthly')
    ?.reduce((sum, s) => sum + Number(s.amount), 0) || 0

  const billingCycleLabels: Record<string, string> = {
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    yearly: 'Anual',
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Mensual
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-50">
              <Repeat className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalMonthly)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Suscripciones Activas
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {subscriptions?.filter(s => s.is_active).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Suscripciones
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50">
              <Repeat className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {subscriptions?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Todas las Suscripciones</CardTitle>
            <Button onClick={() => {setSelectedSubscription(null); setDialogOpen(true)}}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Suscripción
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : (
            <div className="space-y-3">
              {subscriptions?.map((subscription) => {
                const daysUntil = Math.ceil(
                  (new Date(subscription.next_billing_date).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
                const isUrgent = daysUntil <= 7 && subscription.is_active

                return (
                  <div
                    key={subscription.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      subscription.is_active ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isUrgent ? 'bg-orange-50' : 'bg-blue-50'}`}>
                        {isUrgent ? (
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Repeat className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{subscription.name}</p>
                          {!subscription.is_active && (
                            <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                              Inactiva
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{subscription.categories?.icon} {subscription.categories?.name}</span>
                          <span>•</span>
                          <span>{billingCycleLabels[subscription.billing_cycle]}</span>
                          {subscription.is_active && (
                            <>
                              <span>•</span>
                              <span>Próximo pago en {daysUntil} {daysUntil === 1 ? 'día' : 'días'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(subscription.amount)}</p>
                        <p className="text-sm text-gray-500">{formatShortDate(subscription.next_billing_date)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {setSelectedSubscription(subscription); setDialogOpen(true)}}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('¿Eliminar esta suscripción?')) {
                            deleteMutation.mutate(subscription.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )
              })}
              {(!subscriptions || subscriptions.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  <Repeat className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No hay suscripciones registradas</p>
                  <Button onClick={() => {setSelectedSubscription(null); setDialogOpen(true)}} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Suscripción
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <SubscriptionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subscription={selectedSubscription}
      />
    </div>
  )
}
