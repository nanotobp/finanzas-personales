'use client'

import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'

const incomeSchema = z.object({
  amount: z.string().min(1, 'El monto es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  category_id: z.string().min(1, 'La categoría es requerida'),
  account_id: z.string().min(1, 'La cuenta es requerida'),
  client_id: z.string().optional(),
  project_id: z.string().optional(),
  date: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().optional(),
})

type IncomeFormData = z.infer<typeof incomeSchema>

interface IncomeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  income?: any
}

export function IncomeFormDialog({ open, onOpenChange, income }: IncomeFormDialogProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { userId } = useAuth()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'income'],
    queryFn: async () => {
      if (!userId) throw new Error('No user')
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'income')
        .order('name')
      
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      if (!userId) throw new Error('No user')
      
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('name')
      
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      if (!userId) throw new Error('No user')
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-active'],
    queryFn: async () => {
      if (!userId) throw new Error('No user')
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
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
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: income ? {
      amount: income.amount.toString(),
      description: income.description,
      category_id: income.category_id,
      account_id: income.account_id,
      client_id: income.client_id || '',
      project_id: income.project_id || '',
      date: income.date,
      notes: income.notes || '',
    } : {
      date: new Date().toISOString().split('T')[0],
      client_id: '',
      project_id: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: IncomeFormData) => {
      if (!userId) throw new Error('No user')

      const { error } = await supabase.from('transactions').insert({
        user_id: userId,
        type: 'income',
        amount: parseFloat(data.amount),
        description: data.description,
        category_id: data.category_id,
        account_id: data.account_id,
        client_id: data.client_id || null,
        project_id: data.project_id || null,
        date: data.date,
        notes: data.notes || null,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      reset()
      onOpenChange(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: IncomeFormData) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parseFloat(data.amount),
          description: data.description,
          category_id: data.category_id,
          account_id: data.account_id,
          client_id: data.client_id || null,
          project_id: data.project_id || null,
          date: data.date,
          notes: data.notes || null,
        })
        .eq('id', income.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      reset()
      onOpenChange(false)
    },
  })

  const onSubmit = async (data: IncomeFormData) => {
    setIsSubmitting(true)
    try {
      if (income) {
        await updateMutation.mutateAsync(data)
      } else {
        await createMutation.mutateAsync(data)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{income ? 'Editar Ingreso' : 'Nuevo Ingreso'}</DialogTitle>
        </DialogHeader>

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
              placeholder="Ej: Pago de salario"
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
            <Label htmlFor="client_id">Cliente (Opcional)</Label>
            <Select
              value={watch('client_id') || 'none'}
              onValueChange={(value) => setValue('client_id', value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin cliente</SelectItem>
                {clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {isSubmitting ? 'Guardando...' : income ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
