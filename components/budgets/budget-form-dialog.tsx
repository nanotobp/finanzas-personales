'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'

const budgetSchema = z.object({
  category_id: z.string().min(1, 'La categoría es requerida'),
  amount: z.string().min(1, 'El monto es requerido'),
  month: z.string().min(1, 'El mes es requerido'),
  end_date: z.string().optional(),
})

type BudgetFormData = z.infer<typeof budgetSchema>

interface BudgetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget?: any
}

export function BudgetFormDialog({ open, onOpenChange, budget }: BudgetFormDialogProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { userId } = useAuth()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: async () => {
      if (!userId) throw new Error('No user')
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .order('name')
      
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      month: new Date().toISOString().slice(0, 7),
      end_date: '',
      amount: '',
      category_id: '',
    },
  })

  // Resetear el formulario cuando cambia el presupuesto o se abre/cierra el diálogo
  useEffect(() => {
    if (open) {
      if (budget) {
        reset({
          category_id: budget.category_id,
          amount: budget.amount.toString(),
          month: budget.month,
          end_date: budget.end_date || '',
        })
      } else {
        reset({
          month: new Date().toISOString().slice(0, 7),
          end_date: '',
          amount: '',
          category_id: '',
        })
      }
    }
  }, [budget, open, reset])

  const createMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      if (!userId) throw new Error('No user')

      const { error } = await supabase.from('budgets').insert({
        user_id: userId,
        category_id: data.category_id,
        amount: parseFloat(data.amount),
        month: data.month,
        end_date: data.end_date || null,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budgets-summary'] })
      reset()
      onOpenChange(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      const { error } = await supabase
        .from('budgets')
        .update({
          category_id: data.category_id,
          amount: parseFloat(data.amount),
          month: data.month,
          end_date: data.end_date || null,
        })
        .eq('id', budget.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budgets-summary'] })
      reset()
      onOpenChange(false)
    },
  })

  const onSubmit = async (data: BudgetFormData) => {
    setIsSubmitting(true)
    try {
      if (budget) {
        await updateMutation.mutateAsync(data)
      } else {
        await createMutation.mutateAsync(data)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{budget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category_id">Categoría</Label>
            <Select
              value={watch('category_id')}
              onValueChange={(value) => setValue('category_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-sm text-red-500">{errors.category_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto del Presupuesto</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount')}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="month">Mes</Label>
            <Input
              id="month"
              type="month"
              {...register('month')}
            />
            {errors.month && (
              <p className="text-sm text-red-500">{errors.month.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">Fecha de Fin (opcional)</Label>
            <Input
              id="end_date"
              type="month"
              placeholder="Dejar vacío para presupuesto indefinido"
              {...register('end_date')}
            />
            <p className="text-xs text-muted-foreground">
              Para deudas o gastos temporales, establece hasta qué mes aplica este presupuesto
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : budget ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
