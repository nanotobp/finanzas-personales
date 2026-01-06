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

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.string().min(1, 'El tipo es requerido'),
  color: z.string().min(1, 'El color es requerido'),
  icon: z.string().min(1, 'El icono es requerido'),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: any
}

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
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
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: category ? {
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
    } : {
      type: 'expense',
      color: '#64748b',
      icon: '📁',
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const { error } = await supabase.from('categories').insert({
        user_id: user.id,
        name: data.name,
        type: data.type,
        color: data.color,
        icon: data.icon,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      reset()
      onOpenChange(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const { error } = await supabase
        .from('categories')
        .update({
          name: data.name,
          type: data.type,
          color: data.color,
          icon: data.icon,
        })
        .eq('id', category.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      reset()
      onOpenChange(false)
    },
  })

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true)
    try {
      if (category) {
        await updateMutation.mutateAsync(data)
      } else {
        await createMutation.mutateAsync(data)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const commonColors = [
    { value: '#ef4444', label: 'Rojo' },
    { value: '#f97316', label: 'Naranja' },
    { value: '#f59e0b', label: 'Ámbar' },
    { value: '#eab308', label: 'Amarillo' },
    { value: '#84cc16', label: 'Lima' },
    { value: '#22c55e', label: 'Verde' },
    { value: '#10b981', label: 'Esmeralda' },
    { value: '#14b8a6', label: 'Teal' },
    { value: '#06b6d4', label: 'Cian' },
    { value: '#0ea5e9', label: 'Azul Cielo' },
    { value: '#3b82f6', label: 'Azul' },
    { value: '#6366f1', label: 'Índigo' },
    { value: '#8b5cf6', label: 'Violeta' },
    { value: '#a855f7', label: 'Púrpura' },
    { value: '#d946ef', label: 'Fucsia' },
    { value: '#ec4899', label: 'Rosa' },
    { value: '#64748b', label: 'Gris' },
  ]

  const commonIcons = ['💳', '🏠', '🚗', '🍔', '🎮', '💡', '📱', '👕', '🏥', '📚', '🎬', '✈️', '💰', '📈', '💼', '🛒', '🎯', '📁']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Ej: Entretenimiento"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={watch('type')}
              onValueChange={(value) => setValue('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Gasto</SelectItem>
                <SelectItem value="income">Ingreso</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icono</Label>
            <div className="flex gap-2 flex-wrap mb-2">
              {commonIcons.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setValue('icon', emoji)}
                  className={`text-2xl p-2 rounded border-2 ${
                    watch('icon') === emoji ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <Input
              id="icon"
              placeholder="O escribe un emoji"
              {...register('icon')}
              maxLength={2}
            />
            {errors.icon && (
              <p className="text-sm text-red-500">{errors.icon.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="grid grid-cols-9 gap-2 mb-2">
              {commonColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setValue('color', color.value)}
                  className={`w-8 h-8 rounded border-2 ${
                    watch('color') === color.value ? 'border-black' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
            <Input
              id="color"
              type="text"
              placeholder="#000000"
              {...register('color')}
            />
            {errors.color && (
              <p className="text-sm text-red-500">{errors.color.message}</p>
            )}
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
              {isSubmitting ? 'Guardando...' : category ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
