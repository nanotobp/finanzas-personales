'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Coins, TrendingUp, TrendingDown } from 'lucide-react'
import { formatGs } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

export function IVAPayableCard() {
  const supabase = createClient()
  const { userId } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['iva-payable'],
    queryFn: async () => {
      if (!userId) throw new Error('No user')

      const now = new Date()
      const currentMonth = now.toISOString().slice(0, 7)
      const startDate = `${currentMonth}-01`
      const year = parseInt(currentMonth.split('-')[0])
      const month = parseInt(currentMonth.split('-')[1])
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${currentMonth}-${String(lastDay).padStart(2, '0')}`

      // Obtener transacciones del mes e TODAS las facturas pagadas (igual que en taxes)
      const [transactionsResult, invoicesResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('type, iva_amount')
          .eq('user_id', userId)
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('invoices')
          .select('iva_amount')
          .eq('user_id', userId)
          .eq('status', 'paid')
          .not('paid_date', 'is', null)
      ])

      const transactions = transactionsResult.data || []
      const invoices = invoicesResult.data || []

      // IVA de facturas pagadas
      const invoiceIva = invoices.reduce((sum, inv) => sum + (Number(inv.iva_amount) || 0), 0)

      // IVA Cobrado: de transactions (otros ingresos) + facturas pagadas
      const ivaCobrado = (transactions
        .filter(t => t.type === 'income' && t.iva_amount)
        .reduce((sum, t) => sum + Number(t.iva_amount), 0)) + invoiceIva

      // IVA Pagado: solo de transacciones tipo expense
      const ivaPagado = transactions
        .filter(t => t.type === 'expense' && t.iva_amount)
        .reduce((sum, t) => sum + Number(t.iva_amount), 0)

      const ivaPorPagar = ivaCobrado - ivaPagado

      return { ivaCobrado, ivaPagado, ivaPorPagar }
    },
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  const ivaPorPagar = data?.ivaPorPagar || 0
  const ivaCobrado = data?.ivaCobrado || 0
  const ivaPagado = data?.ivaPagado || 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Coins className="h-5 w-5 text-orange-600" />
          IVA a Pagar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total este mes</p>
          <p className={`text-3xl font-bold ${ivaPorPagar >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {formatGs(Math.abs(ivaPorPagar))}
          </p>
          {ivaPorPagar < 0 && (
            <p className="text-xs text-green-600 mt-1">A favor</p>
          )}
        </div>

        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">IVA Cobrado</span>
            </div>
            <span className="text-sm font-mono font-medium">
              {formatGs(ivaCobrado)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">IVA Pagado</span>
            </div>
            <span className="text-sm font-mono font-medium">
              {formatGs(ivaPagado)}
            </span>
          </div>
        </div>

        <div className="pt-2 text-xs text-muted-foreground">
          <p>IVA Ventas incluye todas las facturas pagadas</p>
          <p>IVA Compras del mes actual</p>
        </div>
      </CardContent>
    </Card>
  )
}
