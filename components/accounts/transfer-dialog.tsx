'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { ArrowLeftRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

const transferSchema = z.object({
  from_account_id: z.string().min(1, 'Selecciona cuenta origen'),
  to_account_id: z.string().min(1, 'Selecciona cuenta destino'),
  amount: z.string().min(1, 'El monto es requerido'),
  description: z.string().optional(),
}).refine(data => data.from_account_id !== data.to_account_id, {
  message: 'Las cuentas deben ser diferentes',
  path: ['to_account_id'],
})

type TransferFormData = z.infer<typeof transferSchema>

export function TransferDialog() {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { userId } = useAuth()

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      if (!userId) return []
      const { data } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name')
      return data || []
    },
    enabled: !!userId,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
  })

  const transferMutation = useMutation({
    mutationFn: async (data: TransferFormData) => {
      if (!userId) throw new Error('No autenticado')

      const amount = parseFloat(data.amount)
      const fromAccount = accounts?.find(a => a.id === data.from_account_id)
      const toAccount = accounts?.find(a => a.id === data.to_account_id)

      if (!fromAccount || !toAccount) throw new Error('Cuentas no encontradas')

      // Actualizar saldos
      const { error: fromError } = await supabase
        .from('accounts')
        .update({ balance: fromAccount.balance - amount })
        .eq('id', data.from_account_id)

      if (fromError) throw fromError

      const { error: toError } = await supabase
        .from('accounts')
        .update({ balance: toAccount.balance + amount })
        .eq('id', data.to_account_id)

      if (toError) throw toError

      // Registrar transacciones
      const description = data.description || 'Transferencia entre cuentas'

      // Egreso de cuenta origen
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'expense',
        amount: amount,
        description: `${description} (a ${toAccount.name})`,
        date: new Date().toISOString().split('T')[0],
        account_id: data.from_account_id,
        status: 'confirmed',
      })

      // Ingreso a cuenta destino
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'income',
        amount: amount,
        description: `${description} (desde ${fromAccount.name})`,
        date: new Date().toISOString().split('T')[0],
        account_id: data.to_account_id,
        status: 'confirmed',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast({
        title: 'Transferencia exitosa',
        description: 'La transferencia se ha realizado correctamente',
      })
      reset()
      setOpen(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo realizar la transferencia',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = async (data: TransferFormData) => {
    await transferMutation.mutateAsync(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ArrowLeftRight className="h-4 w-4 mr-2" />
          Transferir
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transferencia entre Cuentas</DialogTitle>
          <DialogDescription>
            Transfiere dinero de una cuenta a otra
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from_account_id">Cuenta Origen</Label>
            <Select
              value={watch('from_account_id')}
              onValueChange={(value) => setValue('from_account_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cuenta" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.currency} {account.balance.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.from_account_id && (
              <p className="text-sm text-red-500">{errors.from_account_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="to_account_id">Cuenta Destino</Label>
            <Select
              value={watch('to_account_id')}
              onValueChange={(value) => setValue('to_account_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cuenta" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.currency} {account.balance.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.to_account_id && (
              <p className="text-sm text-red-500">{errors.to_account_id.message}</p>
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
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              placeholder="Motivo de la transferencia"
              {...register('description')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Transfiriendo...' : 'Transferir'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
