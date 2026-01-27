'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { InvoiceFormDialog } from '@/components/invoices/invoice-form-dialog'
import { ArrowLeft, FilePlus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function NewInvoicePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  const { data: invoices, refetch } = useQuery({
    queryKey: ['recent-invoices', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          client:clients(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (searchTerm) {
        query = query.or(`invoice_number.ilike.%${searchTerm}%,client.name.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    enabled: searchTerm.length > 0,
  })

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: <Badge className="bg-green-500">Pagada</Badge>,
      pending: <Badge className="bg-yellow-500">Pendiente</Badge>,
      overdue: <Badge className="bg-red-500">Vencida</Badge>,
    }
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Generar factura</h1>
          <p className="text-gray-600 mt-1">
            Crea una nueva factura para tus clientes
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Crear nueva factura */}
        <Card>
          <CardHeader>
            <CardTitle>Nueva Factura</CardTitle>
            <CardDescription>
              Completa los datos para generar una factura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvoiceFormDialog 
              trigger={
                <Button size="lg" className="w-full">
                  <FilePlus className="mr-2 h-5 w-5" />
                  Crear Factura
                </Button>
              }
            />
          </CardContent>
        </Card>

        {/* Búsqueda de facturas */}
        <Card>
          <CardHeader>
            <CardTitle>Buscar Facturas</CardTitle>
            <CardDescription>
              Busca por número de factura o cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {searchTerm && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {invoices?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No se encontraron facturas
                  </p>
                ) : (
                  invoices?.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">#{invoice.invoice_number}</span>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.client?.name}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold">
                          {formatCurrency(invoice.amount)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(invoice.issue_date), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
