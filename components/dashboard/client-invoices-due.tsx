'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ClientInvoice {
  id: string
  name: string
  type: 'fixed' | 'occasional'
  monthly_amount: number
  next_invoice_date: Date
  daysUntilDue: number
  status: 'overdue' | 'due-soon' | 'upcoming'
}

export function ClientInvoicesDue() {
  const supabase = createClient()
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 4

  const { data: clients, isLoading } = useQuery({
    queryKey: ['client-invoices'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .eq('type', 'fixed')
        .order('name')

      if (!data) return []

      const today = new Date()
      const currentDay = today.getDate()
      
      return data.map(client => {
        // Asumimos que las facturas vencen el primer día del mes
        const nextInvoiceDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        const diffTime = nextInvoiceDate.getTime() - today.getTime()
        const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        let status: 'overdue' | 'due-soon' | 'upcoming' = 'upcoming'
        if (daysUntilDue < 0) status = 'overdue'
        else if (daysUntilDue <= 7) status = 'due-soon'

        return {
          id: client.id,
          name: client.name,
          type: client.type,
          monthly_amount: client.monthly_amount || 0,
          next_invoice_date: nextInvoiceDate,
          daysUntilDue,
          status
        }
      }).sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    },
  })

  const getStatusBadge = (status: string, days: number) => {
    if (status === 'overdue') {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Vencida ({Math.abs(days)}d)
        </Badge>
      )
    }
    if (status === 'due-soon') {
      return (
        <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400">
          <Calendar className="h-3 w-3" />
          Próxima ({days}d)
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        {days} días
      </Badge>
    )
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const overdueClients = clients?.filter(c => c.status === 'overdue') || []
  const totalPages = Math.ceil(overdueClients.length / itemsPerPage)
  const paginatedClients = overdueClients.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  )

  if (isLoading) {
    return (
      <Card className="shadow-none p-0 border-0">
        <CardHeader className="px-0">
          <CardTitle>Clientes con facturas vencidas</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="text-center py-8 text-muted-foreground">Cargando...</div>
        </CardContent>
      </Card>
    )
  }

  if (!clients || clients.length === 0 || overdueClients.length === 0) {
    return (
      <Card className="shadow-none p-0 border-0">
        <CardHeader className="px-0">
          <CardTitle>Clientes con facturas vencidas</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay facturas vencidas</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-none p-0 border-0">
      <CardHeader className="px-0">
        <div className="flex items-center justify-between">
          <CardTitle>Clientes con facturas vencidas</CardTitle>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-3">
          {paginatedClients.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium">{client.name}</div>
                <div className="text-sm text-muted-foreground">
                  Vence: {formatDate(client.next_invoice_date)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(client.monthly_amount)}
                  </div>
                </div>
                {getStatusBadge(client.status, client.daysUntilDue)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
