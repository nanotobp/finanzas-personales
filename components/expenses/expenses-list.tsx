'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { Search, Filter, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ExpenseFormDialog } from './expense-form-dialog'
import { deleteExpense, fetchExpenseMeta, fetchExpenses } from '@/lib/services/expenses-service'
import { useAuth } from '@/hooks/use-auth'

export function ExpensesList() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { userId } = useAuth()

  const metaQuery = useQuery({
    queryKey: ['expenses-meta'],
    queryFn: () => fetchExpenseMeta(userId as string),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id, userId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budgets-summary'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  const categories = metaQuery.data?.categories ?? []

  const expensesQuery = useQuery({
    queryKey: ['expenses', currentMonth, categoryFilter],
    queryFn: () =>
      fetchExpenses({
        month: currentMonth,
        categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
        userId: userId as string,
      }),
    enabled: !!userId,
    staleTime: 30 * 1000,
  })

  const expenses = expensesQuery.data ?? []

  const filteredExpenses = expenses.filter((expense) =>
    String(expense.description ?? '')
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0)

  const handleEdit = (expense: any) => {
    setSelectedExpense(expense)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return

    try {
      await deleteMutation.mutateAsync(id)
    } catch (e: any) {
      alert(e?.message ?? 'Error al eliminar gasto')
    }
  }

  const handleNewExpense = () => {
    setSelectedExpense(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Gastos del Mes</CardTitle>
              <Button onClick={handleNewExpense}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Gasto
              </Button>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar gastos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Total de gastos</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          </div>

          {metaQuery.isError || expensesQuery.isError ? (
            <div className="text-center py-8 text-red-600 text-sm">
              {String((metaQuery.error as any)?.message || (expensesQuery.error as any)?.message || 'Error')}
            </div>
          ) : metaQuery.isLoading || expensesQuery.isLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : (
            <div className="space-y-2">
              {filteredExpenses?.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{expense.categories?.icon || '💳'}</span>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{expense.categories?.name || 'Sin categoría'}</span>
                          {expense.accounts && (
                            <>
                              <span>•</span>
                              <span>{expense.accounts.name}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{formatShortDate(expense.date)}</span>
                          {expense.status !== 'confirmed' && (
                            <span
                              className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                expense.status === 'reconciled'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {expense.status === 'reconciled' ? 'Conciliado' : 'Pendiente'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-red-600">
                      {formatCurrency(Number(expense.amount))}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(expense)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(expense.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!filteredExpenses || filteredExpenses.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No hay gastos registrados
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={selectedExpense}
      />
    </div>
  )
}
