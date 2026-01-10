'use client'

import { memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

interface RecentTransactionsProps {
  userId: string
}

// Componente TransactionItem memoizado
const TransactionItem = memo(({ transaction }: { transaction: any }) => (
  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group">
    <div className="flex items-center gap-3 flex-1">
      <div
        className={`p-2.5 rounded-full ${
          transaction.type === 'income' 
            ? 'bg-emerald-100 dark:bg-emerald-900/30' 
            : 'bg-rose-100 dark:bg-rose-900/30'
        }`}
      >
        {transaction.type === 'income' ? (
          <ArrowUpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ArrowDownCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{transaction.description}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {transaction.categories?.icon && <span>{transaction.categories.icon}</span>}
          <span>{transaction.categories?.name || 'Sin categoría'}</span>
          <span>•</span>
          <span>{formatShortDate(transaction.date)}</span>
        </p>
      </div>
    </div>
    <div
      className={`font-semibold text-sm ml-2 ${
        transaction.type === 'income' 
          ? 'text-emerald-600 dark:text-emerald-400' 
          : 'text-rose-600 dark:text-rose-400'
      }`}
    >
      {transaction.type === 'income' ? '+' : '-'}
      {formatCurrency(transaction.amount)}
    </div>
  </div>
))
TransactionItem.displayName = 'TransactionItem'

export const RecentTransactions = memo(function RecentTransactions({ userId }: RecentTransactionsProps) {
  const supabase = createClient()

  const { data: transactions } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('id, type, amount, description, date, categories(name, icon, color)')
        .order('date', { ascending: false })
        .limit(10)

      return data || []
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000,
  })

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Transacciones Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {transactions?.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
          {(!transactions || transactions.length === 0) && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                No hay transacciones recientes
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
