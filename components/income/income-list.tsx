'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { Search, Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { IncomeFormDialog } from './income-form-dialog'

export function IncomeList() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedIncome, setSelectedIncome] = useState<any>(null)
  const [monthFilter, setMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7))

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  // Query para facturas pagadas
  const { data: paidInvoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['paid-invoices', monthFilter],
    queryFn: async () => {
      const [year, month] = monthFilter.split('-')
      const startDate = `${monthFilter}-01`
      const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]

      const { data } = await supabase
        .from('invoices')
        .select('*, client:clients(id, name)')
        .eq('status', 'paid')
        .not('paid_date', 'is', null)
        .gte('paid_date', startDate)
        .lte('paid_date', endDate)
        .order('paid_date', { ascending: false })

      return data || []
    },
    staleTime: 2 * 60 * 1000,
  })

  // Query para otros ingresos (no relacionados con facturas)
  const { data: otherIncome, isLoading: loadingOther } = useQuery({
    queryKey: ['other-income', monthFilter],
    queryFn: async () => {
      const [year, month] = monthFilter.split('-')
      const startDate = `${monthFilter}-01`
      const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]

      const { data } = await supabase
        .from('transactions')
        .select('*, categories(name, icon, color), clients(name)')
        .eq('type', 'income')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      return data || []
    },
    staleTime: 2 * 60 * 1000,
  })

  const isLoading = loadingInvoices || loadingOther

  // Combinar y filtrar todos los ingresos
  const allIncome = [
    ...(paidInvoices?.map(inv => ({
      ...inv,
      type: 'invoice',
      description: `Factura ${inv.invoice_number || 'N/A'}`,
      date: inv.paid_date,
      amount: inv.amount,
      client: inv.client ? { name: inv.client.name, id: inv.client.id } : null,
    })) || []),
    ...(otherIncome || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const filteredIncome = allIncome?.filter(item =>
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.client?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalIncome = filteredIncome?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
  const totalFromInvoices = filteredIncome?.filter(i => i.type === 'invoice').reduce((sum, i) => sum + Number(i.amount), 0) || 0
  const totalFromOther = filteredIncome?.filter(i => i.type !== 'invoice').reduce((sum, i) => sum + Number(i.amount), 0) || 0

  const handleEdit = (income: any) => {
    setSelectedIncome(income)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este ingreso?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleNewIncome = () => {
    setSelectedIncome(null)
    setDialogOpen(true)
  }

  // Generar opciones de meses
  const generateMonthOptions = () => {
    const months = []
    const currentDate = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthValue = date.toISOString().slice(0, 7)
      const monthLabel = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
      months.push({ value: monthValue, label: monthLabel })
    }
    return months
  }

  return (
    <div className="space-y-4">
      {/* Información de la vista */}
      <div className="mb-2 text-sm bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <strong className="text-blue-900">Vista de Ingresos por Facturas Pagadas</strong>
            <p className="text-blue-700 mt-1">
              Esta vista muestra únicamente los ingresos provenientes de facturas cobradas 
              desde tu módulo de facturación, más otros ingresos diversos que registres manualmente.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Ingresos Totales</CardTitle>
            <div className="flex gap-2 flex-wrap">
              {/* Selector de mes */}
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              >
                {generateMonthOptions().map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              
              {/* Buscador */}
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar ingresos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Botón para agregar otros ingresos */}
              <Button onClick={handleNewIncome} className="whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Ingreso Varios
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Resumen de ingresos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600">Total Ingresos</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600">De Facturas Pagadas</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalFromInvoices)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredIncome?.filter(i => i.type === 'invoice').length || 0} facturas
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600">Otros Ingresos</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalFromOther)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredIncome?.filter(i => i.type !== 'invoice').length || 0} registros
              </p>
            </div>
          </div>

          {/* Lista de ingresos */}
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : (
            <div className="space-y-2">
              {filteredIncome?.map((item) => {
                const isInvoice = item.type === 'invoice'
                return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    isInvoice ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : 'border-l-4 border-l-purple-500 bg-purple-50/30'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{isInvoice ? '📄' : (item.categories?.icon || '💰')}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{item.description}</p>
                          {isInvoice && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              Factura Pagada
                            </span>
                          )}
                          {!isInvoice && item.categories && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                              {item.categories.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 flex-wrap">
                          {item.client && (
                            <>
                              <span>👤 {item.client.name}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>📅 {formatShortDate(item.date)}</span>
                          {item.notes && (
                            <>
                              <span>•</span>
                              <span className="text-xs italic">{item.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-green-600">
                      +{formatCurrency(Number(item.amount))}
                    </span>
                    {!isInvoice && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          title="Editar ingreso"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          title="Eliminar ingreso"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                )
              })}
              {(!filteredIncome || filteredIncome.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No hay ingresos registrados</p>
                  <p className="text-sm mt-1">Los ingresos de facturas pagadas aparecerán aquí automáticamente</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <IncomeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        income={selectedIncome}
      />
    </div>
  )
}

