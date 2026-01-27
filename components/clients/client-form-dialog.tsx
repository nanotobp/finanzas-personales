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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Plus } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['fixed', 'occasional']),
  ruc: z.string().optional(),
  contact_name: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  monthly_amount: z.string().optional(),
  notes: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

interface ClientFormDialogProps {
  client?: any
  trigger?: React.ReactNode
}

export function ClientFormDialog({ client, trigger }: ClientFormDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { userId } = useAuth()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || '',
      type: client?.type || 'occasional',
      ruc: client?.ruc || '',
      contact_name: client?.contact_name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      address: client?.address || '',
      monthly_amount: client?.monthly_amount?.toString() || '',
      notes: client?.notes || '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (!userId) throw new Error('Usuario no autenticado')

      const clientData = {
        ...data,
        monthly_amount: data.monthly_amount ? parseFloat(data.monthly_amount) : null,
        user_id: userId,
      }

      if (client) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', client.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([clientData])

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast({
        title: client ? 'Cliente actualizado' : 'Cliente creado',
        description: `El cliente ha sido ${client ? 'actualizado' : 'creado'} exitosamente.`,
      })
      setOpen(false)
      form.reset()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Ocurrió un error al guardar el cliente.',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: ClientFormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {client ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {client
              ? 'Actualiza la información del cliente.'
              : 'Agrega un nuevo cliente a tu cartera.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nombre del Cliente *</FormLabel>
                    <FormControl>
                      <Input placeholder="Empresa ABC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cliente *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Fijo (Mensual)</SelectItem>
                        <SelectItem value="occasional">Ocasional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ruc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUC</FormLabel>
                    <FormControl>
                      <Input placeholder="12345678-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Contacto</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contacto@empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+595 21 123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monthly_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Mensual</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Av. Principal 123, Asunción" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales sobre el cliente..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? 'Guardando...'
                  : client
                  ? 'Actualizar'
                  : 'Crear Cliente'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
