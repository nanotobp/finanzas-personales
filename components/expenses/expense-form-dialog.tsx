'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { Textarea } from '@/components/ui/textarea'
import { createExpense, fetchExpenseMeta, updateExpense } from '@/lib/services/expenses-service'
import { useAuth } from '@/hooks/use-auth'

const expenseSchema = z.object({
  amount: z.string().min(1, 'El monto es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  category_id: z.string().min(1, 'La categoría es requerida'),
  account_id: z.string().min(1, 'La cuenta es requerida'),
  date: z.string().min(1, 'La fecha es requerida'),
  project_id: z.string().optional(),
  notes: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: any
}

export function ExpenseFormDialog({ open, onOpenChange, expense }: ExpenseFormDialogProps) {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { userId } = useAuth()

  const { data: meta, isLoading: isMetaLoading } = useQuery({
    queryKey: ['expenses-meta'],
    queryFn: () => fetchExpenseMeta(userId as string),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  const categories = meta?.categories ?? []
  const accounts = meta?.accounts ?? []
  const projects = meta?.projects ?? []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense ? {
      amount: expense.amount.toString(),
      description: expense.description,
      category_id: expense.category_id,
      account_id: expense.account_id,
      date: expense.date,
      project_id: expense.project_id || '',
      notes: expense.notes || '',
    } : {
      date: new Date().toISOString().split('T')[0],
      project_id: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      return createExpense({
        userId: userId as string,
        amount: parseFloat(data.amount),
        description: data.description,
        category_id: data.category_id,
        account_id: data.account_id,
        date: data.date,
        project_id: data.project_id || null,
        notes: data.notes || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budgets-summary'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      reset()
      onOpenChange(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      return updateExpense(expense.id, {
        userId: userId as string,
        amount: parseFloat(data.amount),
        description: data.description,
        category_id: data.category_id,
        account_id: data.account_id,
        date: data.date,
        project_id: data.project_id || null,
        notes: data.notes || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budgets-summary'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      reset()
      onOpenChange(false)
    },
  })

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true)
    try {
      if (expense) {
        await updateMutation.mutateAsync(data)
      } else {
        await createMutation.mutateAsync(data)
      }
    } catch (error) {
      console.error('Error al guardar el gasto:', error)
      alert('Error al guardar el gasto. Por favor, intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{expense ? 'Editar Gasto' : 'Nuevo Gasto'}</DialogTitle>
        </DialogHeader>

        {isMetaLoading ? (
          <div className="p-4 text-sm text-gray-600">Cargando...</div>
        ) : categories.length === 0 || accounts.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              {categories.length === 0 && accounts.length === 0
                ? 'Debes crear al menos una categoría y una cuenta antes de registrar gastos.'
                : categories.length === 0
                ? 'Debes crear al menos una categoría de gastos.'
                : 'Debes crear al menos una cuenta.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
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
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              placeholder="Ej: Compra en supermercado"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

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
            <Label htmlFor="account_id">Cuenta</Label>
            <Select
              value={watch('account_id')}
              onValueChange={(value) => setValue('account_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cuenta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc: any) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.account_id && (
              <p className="text-sm text-red-500">{errors.account_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_id">Proyecto (opcional)</Label>
            <Select
              value={watch('project_id') || 'none'}
              onValueChange={(value) => setValue('project_id', value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin proyecto</SelectItem>
                {projects.map((proj: any) => (
                  <SelectItem key={proj.id} value={proj.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: proj.color }}
                      />
                      {proj.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales..."
              {...register('notes')}
            />
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
              {isSubmitting ? 'Guardando...' : expense ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
