'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const payments = [
  {
    category: 'Electricidad',
    date: '5 enero 2024',
    amount: '+450.00',
    status: 'Pagado',
    statusColor: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20',
  },
  {
    category: 'Internet',
    date: '5 enero 2024',
    amount: '+450.00',
    status: 'Pendiente',
    statusColor: 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20',
  },
  {
    category: 'Apple Music',
    date: '5 enero 2024',
    amount: '+450.00',
    status: 'Cancelado',
    statusColor: 'bg-red-500/10 text-red-500 dark:bg-red-500/20',
  },
  {
    category: 'Mercado',
    date: '5 enero 2024',
    amount: '+450.00',
  },
  {
    category: 'Netflix',
    date: '6 enero 2024',
    amount: '+199.00',
    status: 'Pagado',
    statusColor: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20',
  },
]

export function PaymentsHistory() {
  return (
    <Card className="shadow-none p-0 border-0">
      <CardHeader className="flex flex-row items-center justify-between pb-4 px-0">
        <CardTitle>Historial de Pagos</CardTitle>
        <Link href="#" className="text-sm text-primary hover:underline font-medium">
          Ver más
        </Link>
      </CardHeader>
      <CardContent className="px-0">
        <div className="grid gap-4 mt-3">
          {payments.map((payment, index) => (
            <div key={index} className="grid grid-cols-[1fr,auto] items-center gap-4 bg-card p-3 rounded-lg border">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm">{payment.category}</span>
                <span className="text-xs text-muted-foreground">{payment.date}</span>
              </div>
              <div className="text-right flex flex-col gap-2 items-end">
                <div className="font-bold text-sm">{payment.amount}</div>
                {payment.status && (
                  <Badge variant="secondary" className={cn('rounded-md font-medium text-xs', payment.statusColor)}>
                    {payment.status}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
