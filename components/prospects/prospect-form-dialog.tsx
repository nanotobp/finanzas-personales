'use client'

import { useForm } from 'react-hook-form'
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
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'

interface ProspectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prospect?: any
}

export function ProspectFormDialog({ open, onOpenChange, prospect }: ProspectFormDialogProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    if (prospect) {
      reset(prospect)
    } else {
      reset({
        status: 'lead',
        priority: 'medium',
        temperature: 'warm',
        probability: 50,
      })
    }
  }, [prospect, reset])

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const prospectData = {
        ...data,
        user_id: user.id,
        potential_amount: parseFloat(data.potential_amount) || 0,
        probability: parseInt(data.probability) || 50,
      }

      if (prospect?.id) {
        const { error } = await supabase
          .from('prospects')
          .update(prospectData)
          .eq('id', prospect.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('prospects')
          .insert([prospectData])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
      toast({
        title: prospect ? 'Prospecto actualizado' : 'Prospecto creado',
        description: 'Los cambios se guardaron correctamente',
      })
      onOpenChange(false)
      reset()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: any) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {prospect ? 'Editar Prospecto' : 'Nuevo Prospecto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Contacto *</Label>
              <Input
                id="name"
                {...register('name', { required: true })}
                placeholder="Juan Pérez"
              />
              {errors.name && <span className="text-sm text-red-500">Campo requerido</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                {...register('company')}
                placeholder="Empresa XYZ"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="contacto@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+595 XXX XXX XXX"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              {...register('position')}
              placeholder="Director, Gerente, etc."
            />
          </div>

          {/* Información financiera */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="potential_amount">Monto Potencial (Gs) *</Label>
              <Input
                id="potential_amount"
                type="number"
                {...register('potential_amount', { required: true })}
                placeholder="1000000"
              />
              {errors.potential_amount && <span className="text-sm text-red-500">Campo requerido</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">Probabilidad de Cierre (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                {...register('probability')}
                placeholder="50"
              />
            </div>
          </div>

          {/* Estado y clasificación */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                {...register('status')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="lead">Prospecto</option>
                <option value="contacted">Contactado</option>
                <option value="meeting">Reunión</option>
                <option value="proposal">Propuesta</option>
                <option value="negotiation">Negociación</option>
                <option value="won">Ganado</option>
                <option value="lost">Perdido</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <select
                id="priority"
                {...register('priority')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperatura</Label>
              <select
                id="temperature"
                {...register('temperature')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="cold">❄️ Frío</option>
                <option value="warm">🌤️ Tibio</option>
                <option value="hot">🔥 Caliente</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Fuente de Origen</Label>
            <Input
              id="source"
              {...register('source')}
              placeholder="LinkedIn, Referido, Web, Evento..."
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_date">Fecha de Contacto</Label>
              <Input
                id="contact_date"
                type="date"
                {...register('contact_date')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_contact_date">Próximo Contacto</Label>
              <Input
                id="next_contact_date"
                type="date"
                {...register('next_contact_date')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting_date">Reunión Programada</Label>
              <Input
                id="meeting_date"
                type="datetime-local"
                {...register('meeting_date')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_close_date">Fecha Esperada de Cierre</Label>
            <Input
              id="expected_close_date"
              type="date"
              {...register('expected_close_date')}
            />
          </div>

          {/* Notas y próxima acción */}
          <div className="space-y-2">
            <Label htmlFor="next_action">Próxima Acción</Label>
            <Input
              id="next_action"
              {...register('next_action')}
              placeholder="Llamar para confirmar reunión, enviar propuesta..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Información adicional sobre el prospecto..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : prospect ? 'Actualizar' : 'Crear Prospecto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
