'use client'

import { useMemo, lazy, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { FileText, AlertCircle, CheckCircle, Clock, DollarSign, TrendingUp, Pencil, Trash2 } from 'lucide-react'
import { InvoiceFormDialog } from './invoice-form-dialog'
import { useToast } from '@/hooks/use-toast'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

const ReactECharts = lazy(() => import('echarts-for-react'))

export function InvoicesList() {
  const supabase = createClient()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(name),
          category:categories(name, icon)
        `)
        .order('due_date', { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast({
        title: 'Factura eliminada',
        description: 'La factura ha sido eliminada exitosamente.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la factura.',
        variant: 'destructive',
      })
    },
  })

  // Calcular estadísticas con useMemo
  const stats = useMemo(() => 
    invoices?.reduce((acc, inv) => {
      const amount = Number(inv.amount)
      if (inv.status === 'paid') {
        acc.paid += amount
      } else if (inv.status === 'pending') {
        acc.pending += amount
      } else if (inv.status === 'overdue') {
        acc.overdue += amount
      }
      acc.total += amount
      return acc
    }, { total: 0, paid: 0, pending: 0, overdue: 0 }) || { total: 0, paid: 0, pending: 0, overdue: 0 }
  , [invoices])

  // Datos para gráfico de estado de facturas con useMemo
  const statusChartOptions = useMemo(() => ({
    title: {
      text: 'Estado de Facturas',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      bottom: 0,
      left: 'center'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: invoices?.filter(i => i.status === 'paid').length || 0, name: 'Pagadas', itemStyle: { color: '#10b981' } },
          { value: invoices?.filter(i => i.status === 'pending').length || 0, name: 'Pendientes', itemStyle: { color: '#f59e0b' } },
          { value: invoices?.filter(i => i.status === 'overdue').length || 0, name: 'Vencidas', itemStyle: { color: '#ef4444' } },
        ]
      }
    ]
  }), [invoices])

  // Datos para gráfico de ingresos mensuales con useMemo
  const monthlyChartOptions = useMemo(() => {
    const monthlyData = invoices?.reduce((acc: any, inv) => {
      const month = inv.issue_date.substring(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { paid: 0, pending: 0 }
      }
      if (inv.status === 'paid') {
        acc[month].paid += Number(inv.amount)
      } else {
        acc[month].pending += Number(inv.amount)
      }
      return acc
    }, {})

    const months = Object.keys(monthlyData || {}).sort().slice(-6)
    
    return {
    title: {
      text: 'Ingresos Últimos 6 Meses',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      bottom: 0,
      data: ['Cobrado', 'Pendiente']
    },
    xAxis: {
      type: 'category',
      data: months.map(m => {
        const [year, month] = m.split('-')
        return `${month}/${year.substring(2)}`
      })
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `₲${(value / 1000).toFixed(0)}k`
      }
    },
    series: [
      {
        name: 'Cobrado',
        type: 'bar',
        stack: 'total',
        data: months.map(m => monthlyData?.[m]?.paid || 0),
        itemStyle: { color: '#10b981' }
      },
      {
        name: 'Pendiente',
        type: 'bar',
        stack: 'total',
        data: months.map(m => monthlyData?.[m]?.pending || 0),
        itemStyle: { color: '#f59e0b' }
      }
    ]
  }
}, [invoices])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      paid: { variant: 'default', label: 'Pagado', icon: CheckCircle },
      pending: { variant: 'secondary', label: 'Pendiente', icon: Clock },
      overdue: { variant: 'destructive', label: 'Vencido', icon: AlertCircle },
      cancelled: { variant: 'outline', label: 'Cancelado', icon: AlertCircle },
    }
    const config = variants[status] || variants.pending
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getDaysInfo = (invoice: any) => {
    if (invoice.status === 'paid') {
      return { text: 'Pagado', color: 'text-green-600' }
    }
    const today = new Date()
    const dueDate = new Date(invoice.due_date)
    const diff = differenceInDays(dueDate, today)

    if (diff < 0) {
      return { text: `${Math.abs(diff)} días vencido`, color: 'text-red-600' }
    } else if (diff === 0) {
      return { text: 'Vence hoy', color: 'text-orange-600' }
    } else {
      return { text: `${diff} días restantes`, color: 'text-gray-600' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Facturado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cobrado
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendiente
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pending)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vencido
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <Suspense fallback={<div className="h-[300px] flex items-center justify-center">Cargando gráfico...</div>}>
              <ReactECharts option={statusChartOptions} style={{ height: '300px' }} lazyUpdate={true} />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Suspense fallback={<div className="h-[300px] flex items-center justify-center">Cargando gráfico...</div>}>
              <ReactECharts option={monthlyChartOptions} style={{ height: '300px' }} lazyUpdate={true} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : (
            <div className="space-y-4">
              {invoices?.map((invoice) => {
                const daysInfo = getDaysInfo(invoice)
                return (
                  <div key={invoice.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <div className="font-semibold">{invoice.invoice_number}</div>
                        <div className="text-sm text-muted-foreground">{invoice.client?.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Emisión</div>
                        <div className="font-medium">
                          {format(new Date(invoice.issue_date), 'dd MMM yyyy', { locale: es })}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Vencimiento</div>
                        <div className="font-medium">
                          {format(new Date(invoice.due_date), 'dd MMM yyyy', { locale: es })}
                        </div>
                        <div className={`text-xs ${daysInfo.color}`}>{daysInfo.text}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Monto</div>
                        <div className="font-bold">{formatCurrency(invoice.amount)}</div>
                        {invoice.category && (
                          <div className="text-xs text-muted-foreground">
                            {invoice.category.icon} {invoice.category.name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <InvoiceFormDialog
                        invoice={invoice}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(invoice.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {(!invoices || invoices.length === 0) && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay facturas registradas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
