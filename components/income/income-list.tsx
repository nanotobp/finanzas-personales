'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
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
import { IncomeFormDialog } from './income-form-dialog'

export function IncomeList() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedIncome, setSelectedIncome] = useState<any>(null)
  const currentMonth = new Date().toISOString().slice(0, 7)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  const { data: categories } = useQuery({
    queryKey: ['income-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'income')
        .order('name')
      return data || []
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  })

  const { data: income, isLoading } = useQuery({
    queryKey: ['income', currentMonth, categoryFilter],
    queryFn: async () => {
      const startDate = `${currentMonth}-01`
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
        .toISOString().split('T')[0]

      let query = supabase
        .from('transactions')
        .select('*, categories(name, icon, color), clients(name)')
        .eq('type', 'income')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter)
      }

      const { data } = await query
      return data || []
    },
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
  })

  const filteredIncome = income?.filter(item =>
    item.description.toLowerCase().includes(search.toLowerCase())
  )

  const totalIncome = filteredIncome?.reduce((sum, i) => sum + Number(i.amount), 0) || 0

  const handleEdit = (income: any) => {
    setSelectedIncome(income)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este ingreso?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleNewIncome = () => {
    setSelectedIncome(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Ingresos del Mes</CardTitle>
            <Button onClick={handleNewIncome}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ingreso
            </Button>
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar ingresos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
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
          <div className="mb-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Total de ingresos</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : (
            <div className="space-y-2">
              {filteredIncome?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.categories?.icon || '💰'}</span>
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{item.categories?.name || 'Sin categoría'}</span>
                          {item.clients && (
                            <>
                              <span>•</span>
                              <span>Cliente: {item.clients.name}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{formatShortDate(item.date)}</span>
                          <span
                            className={`ml-2 px-2 py-0.5 rounded text-xs ${
                              item.status === 'confirmed'
                                ? 'bg-green-100 text-green-700'
                                : item.status === 'reconciled'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {item.status === 'confirmed'
                              ? 'Confirmado'
                              : item.status === 'reconciled'
                              ? 'Conciliado'
                              : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-green-600">
                      +{formatCurrency(Number(item.amount))}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!filteredIncome || filteredIncome.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No hay ingresos registrados
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <IncomeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        income={selectedIncome}
      />
    </div>
  )
}
