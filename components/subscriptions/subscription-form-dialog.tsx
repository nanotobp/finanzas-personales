'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Switch } from '@/components/ui/switch'

const subscriptionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  amount: z.string().min(1, 'El monto es requerido'),
  billing_cycle: z.string().min(1, 'El ciclo de facturación es requerido'),
  next_billing_date: z.string().min(1, 'La próxima fecha es requerida'),
  is_active: z.boolean(),
})

type SubscriptionFormData = z.infer<typeof subscriptionSchema>

interface SubscriptionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription?: any
}

export function SubscriptionFormDialog({ open, onOpenChange, subscription }: SubscriptionFormDialogProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      billing_cycle: 'monthly',
      is_active: true,
      next_billing_date: new Date().toISOString().split('T')[0],
    },
  })

  // Reset form when subscription changes
  useEffect(() => {
    if (subscription) {
      reset({
        name: subscription.name,
        amount: subscription.amount.toString(),
        billing_cycle: subscription.billing_cycle,
        next_billing_date: subscription.next_billing_date,
        is_active: subscription.is_active,
      })
    } else {
      reset({
        name: '',
        amount: '',
        billing_cycle: 'monthly',
        is_active: true,
        next_billing_date: new Date().toISOString().split('T')[0],
      })
    }
  }, [subscription, reset])

  const createMutation = useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const { error } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        name: data.name,
        amount: parseFloat(data.amount),
        billing_cycle: data.billing_cycle,
        next_billing_date: data.next_billing_date,
        is_active: data.is_active,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      reset()
      onOpenChange(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          name: data.name,
          amount: parseFloat(data.amount),
          billing_cycle: data.billing_cycle,
          next_billing_date: data.next_billing_date,
          is_active: data.is_active,
        })
        .eq('id', subscription.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      reset()
      onOpenChange(false)
    },
  })

  const onSubmit = async (data: SubscriptionFormData) => {
    setIsSubmitting(true)
    try {
      if (subscription) {
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
          <DialogTitle>{subscription ? 'Editar Suscripción' : 'Nueva Suscripción'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Servicio</Label>
            <Input
              id="name"
              placeholder="Ej: Netflix, Spotify"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

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
            <Label htmlFor="billing_cycle">Ciclo de Facturación</Label>
            <Select
              value={watch('billing_cycle')}
              onValueChange={(value) => setValue('billing_cycle', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ciclo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
            {errors.billing_cycle && (
              <p className="text-sm text-red-500">{errors.billing_cycle.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_billing_date">Próxima Fecha de Pago</Label>
            <Input
              id="next_billing_date"
              type="date"
              {...register('next_billing_date')}
            />
            {errors.next_billing_date && (
              <p className="text-sm text-red-500">{errors.next_billing_date.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Suscripción Activa</Label>
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked: boolean) => setValue('is_active', checked)}
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
              {isSubmitting ? 'Guardando...' : subscription ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
