'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, getMonthEndDate } from '@/lib/utils'
import { TrendingUp, DollarSign, Users } from 'lucide-react'

export function IncomeSummary() {
  const supabase = createClient()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: stats } = useQuery({
    queryKey: ['income-summary', currentMonth],
      queryFn: async () => {
        const startDate = `${currentMonth}-01`
        const endDate = getMonthEndDate(currentMonth)

        // Ingresos directos
        const { data: income } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'income')
          .gte('date', startDate)
          .lte('date', endDate)

        // Facturas cobradas
        const { data: invoices } = await supabase
          .from('invoices')
          .select('amount')
          .eq('status', 'paid')
          .gte('paid_date', startDate)
          .lte('paid_date', endDate)

        // Clientes activos
        const { data: clients } = await supabase
          .from('clients')
          .select('id')
          .eq('is_active', true)

        // Calcular totales
        const totalIncome = (income?.reduce((sum, t) => sum + Number(t.amount), 0) || 0)
          + (invoices?.reduce((sum, i) => sum + Number(i.amount), 0) || 0)
        const incomeCount = (income?.length || 0) + (invoices?.length || 0)
        const activeClients = clients?.length || 0

        return {
          totalIncome,
          incomeCount,
          activeClients,
        }
      },
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Ingresos Totales
          </CardTitle>
          <div className="p-2 rounded-lg bg-green-50">
            <DollarSign className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats?.totalIncome || 0)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Ingresos Registrados
          </CardTitle>
          <div className="p-2 rounded-lg bg-blue-50">
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats?.incomeCount || 0}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Clientes Activos
          </CardTitle>
          <div className="p-2 rounded-lg bg-purple-50">
            <Users className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats?.activeClients || 0}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
