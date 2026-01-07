'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, AlertTriangle, Plus, Pencil, Trash2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { CardFormDialog } from './card-form-dialog'

export function CardsList() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<any>(null)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    },
  })

  const { data: cards, isLoading } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cards')
        .select('*')
        .order('name')

      // Get current expenses for each card
      const currentMonth = new Date().toISOString().slice(0, 7)
      const startDate = `${currentMonth}-01`
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
        .toISOString().split('T')[0]

      const cardsWithDebt = await Promise.all(
        (data || []).map(async (card) => {
          const { data: expenses } = await supabase
            .from('transactions')
            .select('amount')
            .eq('type', 'expense')
            .eq('card_id', card.id)
            .gte('date', startDate)
            .lte('date', endDate)

          const currentDebt = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
          const usagePercentage = card.limit ? (currentDebt / Number(card.limit)) * 100 : 0

          return {
            ...card,
            currentDebt,
            usagePercentage: Math.min(usagePercentage, 100),
            available: card.limit ? Number(card.limit) - currentDebt : 0,
          }
        })
      )

      return cardsWithDebt
    },
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
  })

  const totalDebt = cards?.reduce((sum, c) => sum + (c.currentDebt || 0), 0) || 0
  const totalLimit = cards?.reduce((sum, c) => sum + (Number(c.limit) || 0), 0) || 0
  const activeCards = cards?.filter(c => c.is_active) || []

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-orange-600'
    return 'text-green-600'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-600'
    if (percentage >= 70) return 'bg-orange-600'
    return 'bg-green-600'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Deuda Total
            </CardTitle>
            <div className="p-2 rounded-lg bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDebt)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Límite Total
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50">
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalLimit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tarjetas Activas
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-50">
              <CreditCard className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeCards.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mis Tarjetas</CardTitle>
            <Button onClick={() => {setSelectedCard(null); setDialogOpen(true)}}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarjeta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards?.map((card) => (
                <Card key={card.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{card.name}</h3>
                          {!card.is_active && (
                            <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                              Inactiva
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {card.brand} •••• {card.last_four}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Deuda actual</span>
                          <span className={`font-bold ${getUsageColor(card.usagePercentage)}`}>
                            {card.usagePercentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="relative">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${getProgressColor(card.usagePercentage)}`}
                              style={{ width: `${card.usagePercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                        <div>
                          <p className="text-xs text-gray-600">Usado</p>
                          <p className="font-semibold text-red-600">
                            {formatCurrency(card.currentDebt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Disponible</p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(card.available)}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm pt-3 border-t">
                        <span className="text-gray-600">Cierre: {card.close_day}</span>
                        <span className="text-gray-600">Vencimiento: {card.due_day}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {setSelectedCard(card); setDialogOpen(true)}}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('¿Eliminar esta tarjeta?')) {
                              deleteMutation.mutate(card.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {(!cards || cards.length === 0) && !isLoading && (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No hay tarjetas registradas</p>
              <Button onClick={() => {setSelectedCard(null); setDialogOpen(true)}} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Tarjeta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CardFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        card={selectedCard}
      />
    </div>
  )
}
