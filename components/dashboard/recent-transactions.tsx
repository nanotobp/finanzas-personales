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
  <div
    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
  >
    <div className="flex items-center gap-3">
      <div
        className={`p-2 rounded-lg ${
          transaction.type === 'income' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
        }`}
      >
        {transaction.type === 'income' ? (
          <ArrowUpCircle className="h-4 w-4 text-green-600" />
        ) : (
          <ArrowDownCircle className="h-4 w-4 text-red-600" />
        )}
      </div>
      <div>
        <p className="font-medium text-sm">{transaction.description}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {transaction.categories?.icon} {transaction.categories?.name || 'Sin categoría'} • {formatShortDate(transaction.date)}
        </p>
      </div>
    </div>
    <div
      className={`font-semibold ${
        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
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
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(10)

      return data || []
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transacciones Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions?.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
          {(!transactions || transactions.length === 0) && (
            <p className="text-center text-gray-500 py-8">
              No hay transacciones recientes
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
