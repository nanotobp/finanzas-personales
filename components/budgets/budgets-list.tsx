'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { BudgetFormDialog } from './budget-form-dialog'

export function BudgetsList() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<any>(null)
  const currentMonth = new Date().toISOString().slice(0, 7)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', currentMonth],
    queryFn: async () => {
      const startDate = `${currentMonth}-01`
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
        .toISOString().split('T')[0]

      // Get budgets with categories (active ones: no end_date OR end_date >= current month)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: budgets } = await supabase
        .from('budgets')
        .select('*, categories(name, icon, color)')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .or(`end_date.is.null,end_date.gte.${currentMonth}`)
        .order('amount', { ascending: false })

      // Get expenses for each category
      const budgetsWithSpent = await Promise.all(
        (budgets || []).map(async (budget) => {
          const { data: expenses } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('type', 'expense')
            .eq('category_id', budget.category_id)
            .gte('date', startDate)
            .lte('date', endDate)

          const spent = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
          const percentage = (spent / Number(budget.amount)) * 100

          return {
            ...budget,
            spent,
            percentage: Math.min(percentage, 100),
            remaining: Number(budget.amount) - spent,
          }
        })
      )

      return budgetsWithSpent
    },
  })

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 80) return 'text-orange-600'
    return 'text-green-600'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-600'
    if (percentage >= 80) return 'bg-orange-600'
    return 'bg-green-600'
  }
  const handleEdit = (budget: any) => {
    setSelectedBudget(budget)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este presupuesto?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleNewBudget = () => {
    setSelectedBudget(null)
    setDialogOpen(true)
  }
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Presupuestos del Mes</CardTitle>
            <Button onClick={handleNewBudget}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </div>
        </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : (
          <div className="space-y-6">
            {budgets?.map((budget) => (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{budget.categories?.icon}</span>
                    <div>
                      <p className="font-medium">{budget.categories?.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(budget.spent)} de {formatCurrency(budget.amount)}
                      </p>
                      {budget.end_date && (
                        <p className="text-xs text-orange-600">
                          Válido hasta: {new Date(budget.end_date + '-01').toLocaleDateString('es-PY', { month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getStatusColor(budget.percentage)}`}>
                      {budget.percentage.toFixed(0)}%
                    </p>
                    <p className="text-sm text-gray-500">
                      Quedan {formatCurrency(Math.max(0, budget.remaining))}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getProgressColor(budget.percentage)}`}
                      style={{ width: `${budget.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(budget)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(budget.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            {(!budgets || budgets.length === 0) && (
              <div className="text-center py-12 text-gray-500">
                <p>No hay presupuestos configurados para este mes</p>
                <Button onClick={handleNewBudget} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Presupuesto
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    <BudgetFormDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      budget={selectedBudget}
    />
    </>
  )
}
