'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

const invoiceSchema = z.object({
  client_id: z.string().min(1, 'El cliente es requerido'),
  invoice_number: z.string().min(1, 'El número de factura es requerido'),
  issue_date: z.string().min(1, 'La fecha de emisión es requerida'),
  due_date: z.string().min(1, 'La fecha de vencimiento es requerida'),
  amount: z.string().min(1, 'El monto es requerido'),
  iva_percentage: z.string().default('10'),
  is_iva_exempt: z.boolean().default(false),
  irp_percentage: z.string().default('0'),
  payment_method: z.enum(['bank_transfer', 'cash', 'card', 'check', 'other']),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']),
  paid_date: z.string().optional(),
  destination_category_id: z.string().optional(),
  notes: z.string().optional(),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface InvoiceFormDialogProps {
  invoice?: any
  trigger?: React.ReactNode
}

export function InvoiceFormDialog({ invoice, trigger }: InvoiceFormDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { userId } = useAuth()

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: invoice?.client_id || '',
      invoice_number: invoice?.invoice_number || '',
      issue_date: invoice?.issue_date || new Date().toISOString().split('T')[0],
      due_date: invoice?.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: invoice?.amount?.toString() || '',
      iva_percentage: invoice?.iva_percentage?.toString() || '10',
      is_iva_exempt: invoice?.is_iva_exempt || false,
      irp_percentage: invoice?.irp_percentage?.toString() || '0',
      payment_method: invoice?.payment_method || 'bank_transfer',
      status: invoice?.status || 'pending',
      paid_date: invoice?.paid_date || '',
      destination_category_id: invoice?.destination_category_id || '',
      notes: invoice?.notes || '',
    },
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('name')

      return data || []
    },
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'expense')
        .order('name')

      return data || []
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      // Obtener el user_id actual
      if (!userId) throw new Error('Usuario no autenticado')

      const amount = parseFloat(data.amount)
      const ivaPercentage = parseFloat(data.iva_percentage || '10')
      const irpPercentage = parseFloat(data.irp_percentage || '0')
      const isIvaExempt = data.is_iva_exempt || false

      // Calcular IVA (incluido en el monto total)
      // Si el monto es 110,000 con IVA 10%, entonces: subtotal = 110000/1.10 = 100,000 e IVA = 10,000
      const subtotal = isIvaExempt ? amount : amount / (1 + ivaPercentage / 100)
      const ivaAmount = isIvaExempt ? 0 : amount - subtotal
      const irpWithheld = amount * (irpPercentage / 100)

      const invoiceData = {
        ...data,
        user_id: userId,
        amount,
        subtotal,
        iva_amount: ivaAmount,
        iva_percentage: ivaPercentage,
        total_with_iva: amount,
        is_iva_exempt: isIvaExempt,
        irp_withheld: irpWithheld,
        irp_percentage: irpPercentage,
        // Si due_date está vacío, usar issue_date + 30 días
        due_date: data.due_date || new Date(new Date(data.issue_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // Si el status es 'paid' y no hay paid_date, usar la fecha actual
        paid_date: data.status === 'paid' 
          ? (data.paid_date || new Date().toISOString().split('T')[0])
          : (data.paid_date || null),
        destination_category_id: data.destination_category_id || null,
        notes: data.notes || null,
      }

      if (invoice) {
        const { error } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', invoice.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('invoices')
          .insert([invoiceData])

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast({
        title: invoice ? 'Factura actualizada' : 'Factura creada',
        description: `La factura ha sido ${invoice ? 'actualizada' : 'creada'} exitosamente.`,
      })
      setOpen(false)
      form.reset()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Ocurrió un error al guardar la factura.',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: InvoiceFormData) => {
    mutation.mutate(data)
  }

  const watchStatus = form.watch('status')
  const watchAmount = form.watch('amount')
  const watchIvaPercentage = form.watch('iva_percentage')
  const watchIrpPercentage = form.watch('irp_percentage')

  // Calcular desglose de IVA e IRP en tiempo real
  const breakdown = useMemo(() => {
    const amount = parseFloat(watchAmount || '0')
    const ivaPerc = parseFloat(watchIvaPercentage || '10')
    const irpPerc = parseFloat(watchIrpPercentage || '0')
    
    const subtotal = ivaPerc === 0 ? amount : amount / (1 + ivaPerc / 100)
    const ivaAmount = amount - subtotal
    const irpAmount = amount * (irpPerc / 100)
    
    return {
      amount,
      subtotal,
      ivaAmount,
      irpAmount,
      netReceivable: amount - irpAmount
    }
  }, [watchAmount, watchIvaPercentage, watchIrpPercentage])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Factura
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? 'Editar Factura' : 'Nueva Factura'}
          </DialogTitle>
          <DialogDescription>
            {invoice
              ? 'Actualiza la información de la factura.'
              : 'Registra una nueva factura para seguimiento de cobro.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Factura *</FormLabel>
                    <FormControl>
                      <Input placeholder="001-001-0000001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Total (con IVA) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iva_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IVA (%) *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">0% (Exento)</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="irp_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IRP Retenido (%)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">0% (Sin retención)</SelectItem>
                        <SelectItem value="3">3%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="8">8%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Desglose de impuestos */}
              {breakdown.amount > 0 && (
                <div className="col-span-2 p-4 bg-muted/50 rounded-lg border space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Desglose de Factura:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Subtotal (sin IVA):</span>
                    </div>
                    <div className="text-right font-medium">
                      ₲ {breakdown.subtotal.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div>
                      <span className="text-muted-foreground">IVA ({watchIvaPercentage}%):</span>
                    </div>
                    <div className="text-right font-medium text-blue-600">
                      ₲ {breakdown.ivaAmount.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div className="border-t pt-2">
                      <span className="font-semibold">Total:</span>
                    </div>
                    <div className="text-right font-bold border-t pt-2">
                      ₲ {breakdown.amount.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    {breakdown.irpAmount > 0 && (
                      <>
                        <div className="border-t pt-2">
                          <span className="text-muted-foreground">IRP Retenido ({watchIrpPercentage}%):</span>
                        </div>
                        <div className="text-right font-medium text-orange-600 border-t pt-2">
                          - ₲ {breakdown.irpAmount.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                        <div className="border-t pt-2">
                          <span className="font-semibold text-green-700">A Recibir:</span>
                        </div>
                        <div className="text-right font-bold text-green-700 border-t pt-2">
                          ₲ {breakdown.netReceivable.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="card">Tarjeta</SelectItem>
                        <SelectItem value="check">Cheque</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Emisión *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Vencimiento *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="paid">Pagado</SelectItem>
                        <SelectItem value="overdue">Vencido</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchStatus === 'paid' && (
                <FormField
                  control={form.control}
                  name="paid_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Pago</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="destination_category_id"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Destino del Dinero (Categoría de Gasto)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                      defaultValue={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona destino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin destino específico</SelectItem>
                        {categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        placeholder="Notas adicionales sobre la factura..."
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
                  : invoice
                  ? 'Actualizar'
                  : 'Crear Factura'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
