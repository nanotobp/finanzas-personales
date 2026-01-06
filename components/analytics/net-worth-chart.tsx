'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function NetWorthChart() {
  const supabase = createClient()

  const { data: netWorthData, isLoading } = useQuery({
    queryKey: ['net-worth-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Obtener cuentas por mes
      const { data: accounts } = await supabase
        .from('accounts')
        .select('balance, created_at')
        .eq('user_id', user.id)
        .order('created_at')

      // Agregar datos por mes
      const monthlyData = new Map()
      const currentMonth = new Date().toISOString().slice(0, 7)
      
      // Últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const month = date.toISOString().slice(0, 7)
        monthlyData.set(month, { assets: 0, liabilities: 0 })
      }

      // Calcular patrimonio neto mensual
      accounts?.forEach(account => {
        const month = new Date(account.created_at).toISOString().slice(0, 7)
        if (monthlyData.has(month)) {
          const current = monthlyData.get(month)
          if (Number(account.balance) >= 0) {
            current.assets += Number(account.balance)
          } else {
            current.liabilities += Math.abs(Number(account.balance))
          }
        }
      })

      return Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        netWorth: data.assets - data.liabilities,
        assets: data.assets,
        liabilities: data.liabilities,
      }))
    },
  })

  if (isLoading) {
    return <Card className="col-span-full"><CardContent className="h-96 flex items-center justify-center">Cargando...</CardContent></Card>
  }

  const currentNetWorth = netWorthData?.[netWorthData.length - 1]?.netWorth || 0
  const previousNetWorth = netWorthData?.[netWorthData.length - 2]?.netWorth || 0
  const change = currentNetWorth - previousNetWorth
  const changePercent = previousNetWorth !== 0 ? (change / previousNetWorth) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Patrimonio Neto</CardTitle>
          <div className="text-right">
            <div className="text-3xl font-bold">
              Gs {currentNetWorth.toLocaleString('es-CO')}
            </div>
            <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              Gs {Math.abs(change).toLocaleString('es-CO')} ({changePercent.toFixed(1)}%)
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={netWorthData}>
            <defs>
              <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tickFormatter={(value) => format(new Date(value + '-01'), 'MMM', { locale: es })}
            />
            <YAxis tickFormatter={(value) => `Gs ${(value / 1000).toFixed(0)}k`} />
            <Tooltip 
              formatter={(value: number) => [`Gs ${value.toLocaleString('es-CO')}`, 'Patrimonio Neto']}
              labelFormatter={(label) => format(new Date(label + '-01'), 'MMMM yyyy', { locale: es })}
            />
            <Area 
              type="monotone" 
              dataKey="netWorth" 
              stroke="#8b5cf6" 
              fillOpacity={1}
              fill="url(#colorNetWorth)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
