'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, Film, GraduationCap, Scissors, Smartphone, ShoppingBag, Coffee, Home } from 'lucide-react'

const transactions = [
  {
    category: 'Belleza',
    icon: Scissors,
    iconColor: 'bg-emerald-500',
    date: '12.12.2023',
    description: 'Corte de pelo y productos',
    amount: -45.0,
    currency: 'USD',
  },
  {
    category: 'Servicios',
    icon: Smartphone,
    iconColor: 'bg-blue-500',
    date: '12.12.2023',
    description: 'Internet mensual',
    amount: -60.0,
    currency: 'USD',
  },
  {
    category: 'Auto',
    icon: Car,
    iconColor: 'bg-cyan-500',
    date: '12.12.2023',
    description: 'Combustible y lavado',
    amount: -30.5,
    currency: 'USD',
  },
  {
    category: 'Educación',
    icon: GraduationCap,
    iconColor: 'bg-sky-500',
    date: '12.12.2023',
    description: 'Curso online',
    amount: -25.0,
    currency: 'USD',
  },
]

export function TransactionHistoryTable() {
  return (
    <Card className="shadow-none p-0 border-0">
      <CardHeader className="px-0">
        <CardTitle>Historial de Transacciones</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm border-separate border-spacing-y-3">
            <thead>
              <tr className="text-sm font-medium text-muted-foreground">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-muted/50 rounded-l-3xl">
                  Categoría
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-muted/50">
                  Fecha
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-muted/50">
                  Descripción
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground bg-muted/50">
                  Monto
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground bg-muted/50 rounded-r-3xl">
                  Moneda
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => {
                const Icon = transaction.icon
                return (
                  <tr key={index} className="bg-card border border-border transition-colors hover:bg-muted/30">
                    <td className="p-4 rounded-l-3xl">
                      <div className="flex items-center gap-3">
                        <div className={`${transaction.iconColor} p-2 rounded-full`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium">{transaction.category}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{transaction.date}</td>
                    <td className="p-4">{transaction.description}</td>
                    <td className="p-4 text-right font-semibold">{transaction.amount.toFixed(2)}</td>
                    <td className="p-4 text-right rounded-r-3xl text-muted-foreground">{transaction.currency}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
