'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Building2 } from 'lucide-react'

export function TopMerchants() {
  const supabase = createClient()

  const { data: merchants = [] } = useQuery({
    queryKey: ['top-merchants'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('transactions')
        .select('description, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .order('amount', { ascending: false })
        .limit(10)

      if (error) throw error

      // Agrupar por descripción y sumar
      const grouped = data.reduce((acc: any, curr) => {
        const key = curr.description || 'Sin descripción'
        if (!acc[key]) {
          acc[key] = { name: key, total: 0, count: 0 }
        }
        acc[key].total += Number(curr.amount)
        acc[key].count += 1
        return acc
      }, {})

      return Object.values(grouped)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 10)
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Top 10 Comercios
        </CardTitle>
        <CardDescription>Tus principales gastos por comercio</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {merchants.map((merchant: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-semibold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-sm">{merchant.name}</p>
                  <p className="text-xs text-muted-foreground">{merchant.count} transacciones</p>
                </div>
              </div>
              <p className="font-semibold text-violet-700">
                Gs {Number(merchant.total).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
