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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/use-auth'

const projectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  color: z.string().optional(),
  is_active: z.boolean().optional(),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: any
}

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { userId } = useAuth()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#3B82F6',
      is_active: true,
    },
  })

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description || '',
        color: project.color || '#3B82F6',
        is_active: project.is_active ?? true,
      })
    } else {
      reset({
        name: '',
        description: '',
        color: '#3B82F6',
        is_active: true,
      })
    }
  }, [project, reset])

  const createMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      if (!userId) throw new Error('No user')

      const { error } = await supabase.from('projects').insert({
        user_id: userId,
        name: data.name,
        description: data.description || null,
        color: data.color || '#3B82F6',
        is_active: data.is_active ?? true,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      reset()
      onOpenChange(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const { error } = await supabase
        .from('projects')
        .update({
          name: data.name,
          description: data.description || null,
          color: data.color || '#3B82F6',
          is_active: data.is_active ?? true,
        })
        .eq('id', project.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      reset()
      onOpenChange(false)
    },
  })

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    try {
      if (project) {
        await updateMutation.mutateAsync(data)
      } else {
        await createMutation.mutateAsync(data)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const colorOptions = [
    { value: '#3B82F6', label: 'Azul' },
    { value: '#10B981', label: 'Verde' },
    { value: '#F59E0B', label: 'Naranja' },
    { value: '#EF4444', label: 'Rojo' },
    { value: '#8B5CF6', label: 'Púrpura' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#06B6D4', label: 'Cyan' },
    { value: '#6B7280', label: 'Gris' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? 'Editar Proyecto' : 'Nuevo Proyecto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Proyecto</Label>
            <Input
              id="name"
              placeholder="Ej: Marketing Digital, Desarrollo Web"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Describe el proyecto o centro de costo"
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setValue('color', color.value)}
                  className={`h-10 rounded-md border-2 transition-all ${
                    watch('color') === color.value
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Proyecto Activo</Label>
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
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
              {isSubmitting ? 'Guardando...' : project ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
