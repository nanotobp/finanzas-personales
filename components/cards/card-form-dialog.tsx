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

const cardSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  last_four: z.string().regex(/^\d{4}$/, 'Debe ser 4 dígitos'),
  credit_limit: z.string().min(1, 'El límite de crédito es requerido'),
  available_credit: z.string().optional(),
  billing_day: z.string().min(1, 'El día de corte es requerido'),
  payment_day: z.string().min(1, 'El día de pago es requerido'),
  issuer: z.string().optional(),
})

type CardFormData = z.infer<typeof cardSchema>

interface CardFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card?: any
}

export function CardFormDialog({ open, onOpenChange, card }: CardFormDialogProps) {
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
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: card ? {
      name: card.name,
      last_four: card.last_four,
      credit_limit: card.credit_limit.toString(),
      available_credit: card.available_credit?.toString() || '',
      billing_day: card.billing_day.toString(),
      payment_day: card.payment_day.toString(),
      issuer: card.issuer || '',
    } : {
      billing_day: '1',
      payment_day: '15',
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: CardFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const { error } = await supabase.from('cards').insert({
        user_id: user.id,
        name: data.name,
        last_four: data.last_four,
        credit_limit: parseFloat(data.credit_limit),
        available_credit: data.available_credit ? parseFloat(data.available_credit) : parseFloat(data.credit_limit),
        billing_day: parseInt(data.billing_day),
        payment_day: parseInt(data.payment_day),
        issuer: data.issuer || null,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      reset()
      onOpenChange(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: CardFormData) => {
      const { error } = await supabase
        .from('cards')
        .update({
          name: data.name,
          last_four: data.last_four,
          credit_limit: parseFloat(data.credit_limit),
          available_credit: data.available_credit ? parseFloat(data.available_credit) : parseFloat(data.credit_limit),
          billing_day: parseInt(data.billing_day),
          payment_day: parseInt(data.payment_day),
          issuer: data.issuer || null,
        })
        .eq('id', card.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      reset()
      onOpenChange(false)
    },
  })

  const onSubmit = async (data: CardFormData) => {
    setIsSubmitting(true)
    try {
      if (card) {
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
          <DialogTitle>{card ? 'Editar Tarjeta' : 'Nueva Tarjeta'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Tarjeta</Label>
            <Input
              id="name"
              placeholder="Ej: Visa Gold"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuer">Banco Emisor (opcional)</Label>
            <Input
              id="issuer"
              placeholder="Ej: Banco Nacional"
              {...register('issuer')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_four">Últimos 4 Dígitos</Label>
            <Input
              id="last_four"
              maxLength={4}
              placeholder="1234"
              {...register('last_four')}
            />
            {errors.last_four && (
              <p className="text-sm text-red-500">{errors.last_four.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credit_limit">Límite de Crédito</Label>
              <Input
                id="credit_limit"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('credit_limit')}
              />
              {errors.credit_limit && (
                <p className="text-sm text-red-500">{errors.credit_limit.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="available_credit">Crédito Disponible</Label>
              <Input
                id="available_credit"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('available_credit')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billing_day">Día de Corte</Label>
              <Select
                value={watch('billing_day')}
                onValueChange={(value) => setValue('billing_day', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Día" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.billing_day && (
                <p className="text-sm text-red-500">{errors.billing_day.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_day">Día de Pago</Label>
              <Select
                value={watch('payment_day')}
                onValueChange={(value) => setValue('payment_day', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Día" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.payment_day && (
                <p className="text-sm text-red-500">{errors.payment_day.message}</p>
              )}
            </div>
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
              {isSubmitting ? 'Guardando...' : card ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
