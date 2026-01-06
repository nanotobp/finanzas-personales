'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Wallet, CreditCard, TrendingUp } from 'lucide-react'

export function NetWorthBreakdown() {
  const supabase = createClient()

  const { data: breakdown, isLoading } = useQuery({
    queryKey: ['net-worth-breakdown'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: accounts } = await supabase
        .from('accounts')
        .select('name, balance, type')
        .eq('user_id', user.id)

      const assets = accounts?.filter(a => Number(a.balance) >= 0) || []
      const liabilities = accounts?.filter(a => Number(a.balance) < 0) || []

      const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance), 0)
      const totalLiabilities = Math.abs(liabilities.reduce((sum, a) => sum + Number(a.balance), 0))

      return {
        assets: assets.map(a => ({ name: a.name, value: Number(a.balance) })),
        liabilities: liabilities.map(a => ({ name: a.name, value: Math.abs(Number(a.balance)) })),
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities,
      }
    },
  })

  if (isLoading) return null

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Activos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <CardTitle>Activos</CardTitle>
          </div>
          <div className="text-3xl font-bold text-green-600">
            Gs {breakdown?.totalAssets.toLocaleString('es-CO')}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {breakdown?.assets.map((asset, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{asset.name}</span>
                <span>Gs {asset.value.toLocaleString('es-CO')}</span>
              </div>
              <Progress 
                value={(asset.value / breakdown.totalAssets) * 100} 
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pasivos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-red-600" />
            <CardTitle>Pasivos</CardTitle>
          </div>
          <div className="text-3xl font-bold text-red-600">
            Gs {breakdown?.totalLiabilities.toLocaleString('es-CO')}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {breakdown?.liabilities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              ¡Excelente! No tienes deudas 🎉
            </p>
          ) : (
            breakdown?.liabilities.map((liability, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{liability.name}</span>
                  <span>Gs {liability.value.toLocaleString('es-CO')}</span>
                </div>
                <Progress 
                  value={(liability.value / breakdown.totalLiabilities) * 100} 
                  className="h-2"
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
