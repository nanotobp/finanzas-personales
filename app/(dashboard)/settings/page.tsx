'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, Palette } from 'lucide-react'
import { CategoryFormDialog } from '@/components/categories/category-form-dialog'
import { useSidebarPreferences, colorGradients } from '@/hooks/use-sidebar-preferences'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const { color, setColor } = useSidebarPreferences()

  const colorOptions = [
    { name: 'Violeta', value: 'violet', gradient: 'from-violet-600 to-purple-600' },
    { name: 'Azul', value: 'blue', gradient: 'from-blue-600 to-indigo-600' },
    { name: 'Verde', value: 'green', gradient: 'from-emerald-600 to-teal-600' },
    { name: 'Naranja', value: 'orange', gradient: 'from-orange-600 to-red-600' },
    { name: 'Rosa', value: 'pink', gradient: 'from-pink-600 to-rose-600' },
    { name: 'Pizarra', value: 'slate', gradient: 'from-slate-700 to-slate-900' },
  ]

  const { data: expenseCategories = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .order('name')
      
      if (error) throw error
      return data
    },
  })

  const { data: incomeCategories = [], isLoading: loadingIncome } = useQuery({
    queryKey: ['categories', 'income'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'income')
        .order('name')
      
      if (error) throw error
      return data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const handleEdit = (category: any) => {
    setSelectedCategory(category)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleNew = () => {
    setSelectedCategory(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">
            Personaliza tu experiencia y administra tus categorías
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {/* Color del Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Tema del Sidebar
          </CardTitle>
          <CardDescription>
            Personaliza el color del sidebar y los elementos de la interfaz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setColor(option.value)}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all hover:scale-105",
                  color === option.value
                    ? "border-primary shadow-lg"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div
                  className={cn(
                    "h-16 w-full rounded-md bg-gradient-to-r shadow-md",
                    option.gradient
                  )}
                />
                <span className="text-sm font-medium">{option.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorías de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingExpenses ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseCategories.map((category: any) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  style={{ borderLeft: `4px solid ${category.color}` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {expenseCategories.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No hay categorías de gastos
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorías de Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingIncome ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomeCategories.map((category: any) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  style={{ borderLeft: `4px solid ${category.color}` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {incomeCategories.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No hay categorías de ingresos
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={selectedCategory}
      />
    </div>
  )
}
