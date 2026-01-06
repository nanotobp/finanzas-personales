'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import { PiggyBank, Pencil, Trash2, Calendar } from 'lucide-react'
import { GoalFormDialog } from './goal-form-dialog'
import { useToast } from '@/hooks/use-toast'

export function GoalsList() {
  const supabase = createClient()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: goals, isLoading } = useQuery({
    queryKey: ['savings-goals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('savings_goals')
        .select('*')
        .order('created_at', { ascending: false })

      return data || []
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] })
      toast({
        title: 'Objetivo eliminado',
        description: 'El objetivo ha sido eliminado exitosamente.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el objetivo.',
        variant: 'destructive',
      })
    },
  })

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este objetivo?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('es-PY', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mis Objetivos de Ahorro</CardTitle>
            <GoalFormDialog />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : !goals || goals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <PiggyBank className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No hay objetivos registrados</p>
              <GoalFormDialog trigger={
                <Button className="mt-4">
                  <PiggyBank className="h-4 w-4 mr-2" />
                  Crear Primer Objetivo
                </Button>
              } />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => {
                const progress = goal.target_amount > 0 
                  ? (goal.current_amount / goal.target_amount) * 100 
                  : 0
                const remaining = goal.target_amount - goal.current_amount

                return (
                  <Card key={goal.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{goal.name}</h3>
                            {goal.deadline && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(goal.deadline)}
                              </div>
                            )}
                          </div>
                          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-full">
                            <PiggyBank className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progreso</span>
                            <span className="font-semibold">{progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Actual:</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(goal.current_amount)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Objetivo:</span>
                            <span className="font-semibold">
                              {formatCurrency(goal.target_amount)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm pt-2 border-t">
                            <span className="text-muted-foreground">Falta:</span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {formatCurrency(remaining)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <GoalFormDialog
                            goal={goal}
                            trigger={
                              <Button variant="outline" size="sm" className="flex-1">
                                <Pencil className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(goal.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
