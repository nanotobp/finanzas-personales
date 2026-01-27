'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, getMonthEndDate } from '@/lib/utils'
import { Receipt, TrendingUp, TrendingDown, Calculator, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'

export function TaxSummary() {
  const supabase = createClient()
  const { userId } = useAuth()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: summary, isLoading } = useQuery({
    queryKey: ['tax-summary', currentMonth],
    queryFn: async () => {
      if (!userId) throw new Error('No user')

      const startDate = `${currentMonth}-01`
      const endDate = getMonthEndDate(currentMonth)

      // Obtener transacciones del mes e TODAS las facturas pagadas
      const [transactionsResult, invoicesResult, settingsResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('invoices')
          .select('amount, iva_amount, irp_withheld, subtotal')
          .eq('user_id', userId)
          .eq('status', 'paid')
          .not('paid_date', 'is', null),
        supabase
          .from('tax_settings')
          .select('*')
          .eq('user_id', userId)
          .single()
      ])

      if (transactionsResult.error) throw transactionsResult.error
      const transactions = transactionsResult.data || []
      const invoices = invoicesResult.data || []
      const settings = settingsResult.data

      // Usar los campos de IVA e IRP calculados y almacenados en las facturas
      const invoiceIva = invoices.reduce((sum, inv) => sum + (Number(inv.iva_amount) || 0), 0)
      const invoiceIrp = invoices.reduce((sum, inv) => sum + (Number(inv.irp_withheld) || 0), 0)
      const invoiceIncome = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)

      // Calcular totales de transacciones
      // IVA Ventas: de transactions (otros ingresos) + facturas pagadas
      const ivaVentas = (transactions
        ?.filter(t => t.type === 'income')
        ?.reduce((sum, t) => sum + (Number(t.iva_amount) || 0), 0) || 0) + invoiceIva

      const ivaCompras = transactions
        ?.filter(t => t.type === 'expense')
        ?.reduce((sum, t) => sum + (Number(t.iva_amount) || 0), 0) || 0

      const irpTotal = (transactions
        ?.reduce((sum, t) => sum + (Number(t.irp_amount) || 0), 0) || 0) + invoiceIrp

      // Ingresos totales: otros ingresos de transactions + facturas pagadas
      const ingresosTotales = (transactions
        ?.filter(t => t.type === 'income')
        ?.reduce((sum, t) => sum + Number(t.amount), 0) || 0) + invoiceIncome

      const gastosTotales = transactions
        ?.filter(t => t.type === 'expense')
        ?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

      return {
        iva_ventas: ivaVentas,
        iva_compras: ivaCompras,
        iva_a_pagar: ivaVentas - ivaCompras,
        irp_total: irpTotal,
        ingresos_totales: ingresosTotales,
        gastos_totales: gastosTotales,
      }
    },
    enabled: !!userId,
  })

  if (isLoading) {
    return <div>Cargando resumen fiscal...</div>
  }

  const ivaAPagar = summary?.iva_a_pagar || 0
  const needsAttention = ivaAPagar > 100000 || (summary?.irp_total || 0) > 50000

  return (
    <div className="space-y-4">
      <div className="mb-2 text-xs text-muted-foreground">
        <strong>Nota:</strong> IVA Ventas incluye TODAS las facturas pagadas. IVA Compras incluye transacciones del mes actual. Los cálculos usan los porcentajes configurados en cada factura.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">IVA Ventas</CardTitle>
            <Receipt className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.iva_ventas || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              IVA cobrado en ventas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">IVA Compras</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary?.iva_compras || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              IVA pagado en compras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">IVA a Pagar</CardTitle>
            <Calculator className={`h-4 w-4 ${ivaAPagar > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${ivaAPagar > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
              {formatCurrency(ivaAPagar)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Diferencia a favor/contra
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">IRP Retenido/Pagado</CardTitle>
            <TrendingDown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(summary?.irp_total || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Impuesto a la Renta Personal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resultado Neto</CardTitle>
            <TrendingUp className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              {formatCurrency((summary?.ingresos_totales || 0) - (summary?.gastos_totales || 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ingresos - Gastos del mes
            </p>
          </CardContent>
        </Card>
      </div>

      {needsAttention && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Recordatorio fiscal:</strong> Tienes impuestos pendientes de pago.
            {ivaAPagar > 100000 && ` IVA a pagar: ${formatCurrency(ivaAPagar)}.`}
            {(summary?.irp_total || 0) > 50000 && ` IRP: ${formatCurrency(summary?.irp_total || 0)}.`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
