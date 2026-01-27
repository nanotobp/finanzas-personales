'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Printer, Download, Loader2, FileText, TrendingUp, DollarSign, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { format, startOfMonth, startOfYear, getMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '@/hooks/use-auth'

interface IncomeStatement {
  id: string
  period_month: string
  total_revenue: number
  operating_expenses: number
  iva_collected: number
  iva_paid: number
  iva_payable: number
  irp_withholding: number
  gross_profit: number
  operating_income: number
  net_income: number
  generated_at: string
}

export function FinancialStatementGenerator() {
  const [selectedMonth, setSelectedMonth] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { userId } = useAuth()

  // Generar lista de meses de 2026 (enero a diciembre)
  const currentMonth = getMonth(new Date()) // 0-11
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(2026, i, 1)
    return {
      value: format(monthDate, 'yyyy-MM-dd'),
      label: format(monthDate, 'MMMM yyyy', { locale: es })
    }
  }).slice(0, currentMonth + 1) // Solo meses hasta el mes actual

  // Query para obtener el estado de resultados
  const { data: incomeStatement, isLoading } = useQuery({
    queryKey: ['income-statement', selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income_statements')
        .select('*')
        .eq('period_month', selectedMonth)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as IncomeStatement | null
    }
  })

  // Query para obtener desglose por proyectos
  const { data: projectsBreakdown } = useQuery({
    queryKey: ['projects-breakdown', selectedMonth],
    queryFn: async () => {
      if (!userId) throw new Error('No autenticado')

      // Obtener todos los proyectos activos
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, color')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name')

      if (!projects) return []

      // Para cada proyecto, calcular ingresos y gastos del mes
      const breakdown = await Promise.all(
        projects.map(async (project) => {
          const monthStart = new Date(selectedMonth)
          const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)

          const { data: transactions } = await supabase
            .from('transactions')
            .select('type, amount')
            .eq('user_id', userId)
            .eq('project_id', project.id)
            .gte('date', monthStart.toISOString())
            .lte('date', monthEnd.toISOString())

          const income = transactions
            ?.filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0) || 0

          const expenses = transactions
            ?.filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0) || 0

          return {
            ...project,
            income,
            expenses,
            profit: income - expenses
          }
        })
      )

      return breakdown.filter(p => p.income > 0 || p.expenses > 0)
    },
    enabled: !!incomeStatement && !!userId
  })

  // Mutation para generar estado de resultados
  const generateMutation = useMutation({
    mutationFn: async (month: string) => {
      if (!userId) throw new Error('No autenticado')

      const { data, error } = await supabase.rpc('generate_income_statement', {
        p_user_id: userId,
        p_period_month: month
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-statement'] })
      toast({
        title: 'Estado generado',
        description: 'El estado financiero se generó correctamente'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error al generar',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // TODO: Implementar descarga como PDF
    toast({
      title: 'Descarga',
      description: 'Funcionalidad en desarrollo'
    })
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle>Generar Balance Financiero</CardTitle>
          <CardDescription>
            Selecciona el mes y genera los estados financieros para presentar al banco
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Periodo</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => generateMutation.mutate(selectedMonth)}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generar Estados
                </>
              )}
            </Button>
          </div>

          {incomeStatement && (
            <div className="flex gap-2 pt-2">
              <Button onClick={handlePrint} variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={handleDownload} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vista de estados financieros */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </CardContent>
        </Card>
      ) : incomeStatement ? (
        <Tabs defaultValue="income" className="space-y-4">
          <TabsList>
            <TabsTrigger value="income">Estado de Resultados</TabsTrigger>
            <TabsTrigger value="balance">Balance General</TabsTrigger>
            <TabsTrigger value="cashflow">Flujo de Caja</TabsTrigger>
          </TabsList>

          <TabsContent value="income">
            <Card className="print:shadow-none">
              <CardHeader className="print:border-b">
                <div className="text-center space-y-1">
                  <CardTitle className="text-2xl">Estado de Resultados</CardTitle>
                  <CardDescription>
                    Periodo: {format(new Date(selectedMonth), 'MMMM yyyy', { locale: es })}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground">
                    Generado: {format(new Date(incomeStatement.generated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Ingresos */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Ingresos
                  </h3>
                  <div className="space-y-2 pl-7">
                    <div className="flex justify-between">
                      <span>Ingresos totales</span>
                      <span className="font-mono">
                        {formatCurrency(incomeStatement.total_revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>IVA cobrado</span>
                      <span className="font-mono">
                        {formatCurrency(incomeStatement.iva_collected)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Utilidad Bruta</span>
                    <span className="font-mono text-green-600">
                      {formatCurrency(incomeStatement.gross_profit)}
                    </span>
                  </div>
                </div>

                {/* Gastos */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-red-600" />
                    Gastos Operativos
                  </h3>
                  <div className="space-y-2 pl-7">
                    <div className="flex justify-between">
                      <span>Gastos totales</span>
                      <span className="font-mono text-red-600">
                        ({formatCurrency(incomeStatement.operating_expenses)})
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>IVA pagado</span>
                      <span className="font-mono">
                        {formatCurrency(incomeStatement.iva_paid)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Utilidad Operativa</span>
                    <span className={`font-mono ${ incomeStatement.operating_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(incomeStatement.operating_income)}
                    </span>
                  </div>
                </div>

                {/* Impuestos */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Impuestos</h3>
                  <div className="space-y-2 pl-7">
                    <div className="flex justify-between">
                      <span>IVA a pagar</span>
                      <span className="font-mono">
                        {formatCurrency(incomeStatement.iva_payable)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>IRP retenido</span>
                      <span className="font-mono">
                        {formatCurrency(incomeStatement.irp_withholding)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desglose por Proyectos */}
                {projectsBreakdown && projectsBreakdown.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-lg mb-3">Desglose por Proyectos</h3>
                    <div className="space-y-3 pl-7">
                      {projectsBreakdown.map((project) => (
                        <div key={project.id} className="space-y-1">
                          <div className="flex items-center gap-2 font-medium">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: project.color }}
                            />
                            <span>{project.name}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm pl-5">
                            <div>
                              <span className="text-muted-foreground">Ingresos: </span>
                              <span className="font-mono text-green-600">
                                {formatCurrency(project.income)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Gastos: </span>
                              <span className="font-mono text-red-600">
                                {formatCurrency(project.expenses)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Utilidad: </span>
                              <span className={`font-mono ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(project.profit)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resultado Final */}
                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="flex justify-between font-bold text-xl">
                    <span>Utilidad Neta</span>
                    <span className={`font-mono ${incomeStatement.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(incomeStatement.net_income)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance">
            <Card>
              <CardHeader>
                <CardTitle>Balance General</CardTitle>
                <CardDescription>En desarrollo</CardDescription>
              </CardHeader>
              <CardContent className="p-12 text-center text-muted-foreground">
                Próximamente: Activos, Pasivos y Patrimonio
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Flujo de Caja</CardTitle>
                <CardDescription>En desarrollo</CardDescription>
              </CardHeader>
              <CardContent className="p-12 text-center text-muted-foreground">
                Próximamente: Flujo de operaciones, inversión y financiamiento
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No hay estados financieros para este periodo
            </p>
            <p className="text-sm text-muted-foreground">
              Haz clic en &quot;Generar Estados&quot; para crear el balance financiero
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
