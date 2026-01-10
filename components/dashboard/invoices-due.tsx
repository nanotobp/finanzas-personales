'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { ChevronRight, FileText, Clock, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format, parseISO, isPast } from 'date-fns'
import { es } from 'date-fns/locale'

export function InvoicesDue() {
  const supabase = createClient()

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices-due'],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*, clients(name)')
        .in('status', ['pending', 'overdue'])
        .order('due_date', { ascending: true })
      
      return data || []
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-5 pt-12 pb-24">
        <div className="max-w-md mx-auto space-y-8">
          <Skeleton className="h-8 w-48 bg-slate-800" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 w-full bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const pendingInvoices = invoices?.filter(inv => inv.status === 'pending') || []
  const overdueInvoices = invoices?.filter(inv => inv.status === 'overdue') || []
  const totalDue = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-5 pt-12 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">A cobrar</h1>
          <p className="text-slate-400">Facturas pendientes de pago</p>
        </div>

        {/* Total por cobrar */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl p-6 shadow-2xl">
          <p className="text-indigo-100 text-sm mb-2">Total por cobrar</p>
          <h2 className="text-4xl font-bold">{formatCurrency(totalDue)}</h2>
          <p className="text-indigo-100 text-xs mt-2">{invoices?.length || 0} facturas</p>
        </div>

        {/* Facturas vencidas */}
        {overdueInvoices.length > 0 && (
          <div>
            <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Vencidas ({overdueInvoices.length})
            </h3>
            <div className="space-y-3">
              {overdueInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-4 border border-red-500/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{invoice.clients?.name || 'Sin cliente'}</h4>
                      <p className="text-xs text-slate-400">Factura #{invoice.invoice_number || invoice.id.slice(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCurrency(Number(invoice.amount))}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-300">
                      Vencida: {invoice.due_date ? format(parseISO(invoice.due_date), "d 'de' MMM", { locale: es }) : 'Sin fecha'}
                    </span>
                    <span className="bg-red-500/30 text-red-200 px-2 py-1 rounded-full">
                      Vencida
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Facturas pendientes */}
        {pendingInvoices.length > 0 && (
          <div>
            <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pendientes ({pendingInvoices.length})
            </h3>
            <div className="space-y-3">
              {pendingInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{invoice.clients?.name || 'Sin cliente'}</h4>
                      <p className="text-xs text-slate-400">Factura #{invoice.invoice_number || invoice.id.slice(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCurrency(Number(invoice.amount))}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Vence: {invoice.due_date ? format(parseISO(invoice.due_date), "d 'de' MMM", { locale: es }) : 'Sin fecha'}
                    </span>
                    <span className="bg-amber-500/30 text-amber-200 px-2 py-1 rounded-full">
                      Pendiente
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {(!invoices || invoices.length === 0) && (
          <div className="text-center py-16 text-slate-500">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No hay facturas pendientes</p>
            <p className="text-sm mt-2">¡Excelente! Todo está al día</p>
          </div>
        )}
      </div>
    </div>
  )
}
