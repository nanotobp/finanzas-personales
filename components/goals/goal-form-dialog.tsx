'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

const goalSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  target_amount: z.string().min(1, 'El monto objetivo es requerido'),
  current_amount: z.string().optional(),
  deadline: z.string().optional(),
})

type GoalFormData = z.infer<typeof goalSchema>

interface GoalFormDialogProps {
  goal?: any
  trigger?: React.ReactNode
}

export function GoalFormDialog({ goal, trigger }: GoalFormDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { userId } = useAuth()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: goal ? {
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount?.toString() || '0',
      deadline: goal.deadline || '',
    } : {
      current_amount: '0',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      if (!userId) throw new Error('No autenticado')

      const goalData = {
        user_id: userId,
        name: data.name,
        target_amount: parseFloat(data.target_amount),
        current_amount: parseFloat(data.current_amount || '0'),
        deadline: data.deadline || null,
      }

      if (goal) {
        const { error } = await supabase
          .from('savings_goals')
          .update(goalData)
          .eq('id', goal.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('savings_goals')
          .insert(goalData)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] })
      toast({
        title: goal ? 'Objetivo actualizado' : 'Objetivo creado',
        description: goal ? 'El objetivo se ha actualizado correctamente' : 'El objetivo se ha creado correctamente',
      })
      reset()
      setOpen(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el objetivo',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = async (data: GoalFormData) => {
    await mutation.mutateAsync(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Objetivo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? 'Editar Objetivo' : 'Nuevo Objetivo de Ahorro'}</DialogTitle>
          <DialogDescription>
            {goal ? 'Modifica tu objetivo de ahorro' : 'Crea un nuevo objetivo para alcanzar tus metas'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Objetivo</Label>
            <Input
              id="name"
              placeholder="Ej: Vacaciones, Auto nuevo, Fondo de emergencia"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_amount">Monto Objetivo</Label>
            <Input
              id="target_amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('target_amount')}
            />
            {errors.target_amount && (
              <p className="text-sm text-red-500">{errors.target_amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_amount">Monto Actual</Label>
            <Input
              id="current_amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('current_amount')}
            />
            {errors.current_amount && (
              <p className="text-sm text-red-500">{errors.current_amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Fecha Límite (opcional)</Label>
            <Input
              id="deadline"
              type="date"
              {...register('deadline')}
            />
            {errors.deadline && (
              <p className="text-sm text-red-500">{errors.deadline.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : goal ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
