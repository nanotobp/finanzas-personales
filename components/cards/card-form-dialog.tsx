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

const cardSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  last_four: z.string().regex(/^\d{4}$/, 'Debe ser 4 dígitos'),
  brand: z.string().min(1, 'La marca es requerida'),
  limit: z.string().min(1, 'El límite de crédito es requerido'),
  close_day: z.string().min(1, 'El día de cierre es requerido'),
  due_day: z.string().min(1, 'El día de vencimiento es requerido'),
  is_active: z.boolean().optional(),
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
    defaultValues: {
      brand: 'Visa',
      close_day: '1',
      due_day: '15',
      is_active: true,
    },
  })

  // Reset form when card changes
  useEffect(() => {
    if (card) {
      reset({
        name: card.name,
        last_four: card.last_four,
        brand: card.brand,
        limit: card.limit?.toString() || '',
        close_day: card.close_day?.toString() || '1',
        due_day: card.due_day?.toString() || '15',
        is_active: card.is_active ?? true,
      })
    } else {
      reset({
        name: '',
        last_four: '',
        brand: 'Visa',
        limit: '',
        close_day: '1',
        due_day: '15',
        is_active: true,
      })
    }
  }, [card, reset])

  const createMutation = useMutation({
    mutationFn: async (data: CardFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const { error } = await supabase.from('cards').insert({
        user_id: user.id,
        name: data.name,
        last_four: data.last_four,
        brand: data.brand,
        limit: parseFloat(data.limit),
        close_day: parseInt(data.close_day),
        due_day: parseInt(data.due_day),
        is_active: data.is_active ?? true,
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
          brand: data.brand,
          limit: parseFloat(data.limit),
          close_day: parseInt(data.close_day),
          due_day: parseInt(data.due_day),
          is_active: data.is_active ?? true,
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Select
                value={watch('brand')}
                onValueChange={(value) => setValue('brand', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Visa">Visa</SelectItem>
                  <SelectItem value="Mastercard">Mastercard</SelectItem>
                  <SelectItem value="American Express">American Express</SelectItem>
                  <SelectItem value="Dinners">Dinners</SelectItem>
                  <SelectItem value="Otra">Otra</SelectItem>
                </SelectContent>
              </Select>
              {errors.brand && (
                <p className="text-sm text-red-500">{errors.brand.message}</p>
              )}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Límite de Crédito (Gs.)</Label>
            <Input
              id="limit"
              type="number"
              step="1"
              placeholder="10000000"
              {...register('limit')}
            />
            {errors.limit && (
              <p className="text-sm text-red-500">{errors.limit.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="close_day">Día de Cierre</Label>
              <Select
                value={watch('close_day')}
                onValueChange={(value) => setValue('close_day', value)}
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
              {errors.close_day && (
                <p className="text-sm text-red-500">{errors.close_day.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_day">Día de Vencimiento</Label>
              <Select
                value={watch('due_day')}
                onValueChange={(value) => setValue('due_day', value)}
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
              {errors.due_day && (
                <p className="text-sm text-red-500">{errors.due_day.message}</p>
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
