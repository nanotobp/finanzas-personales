'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Palette, 
  Tag,
  TrendingDown,
  TrendingUp,
  Settings as SettingsIcon,
  Sparkles
} from 'lucide-react'
import { CategoryFormDialog } from '@/components/categories/category-form-dialog'
import { useSidebarPreferences, colorGradients } from '@/hooks/use-sidebar-preferences'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const { color, setColor } = useSidebarPreferences()
  const { toast } = useToast()

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Configuración
          </h1>
          <p className="text-muted-foreground">
            Personaliza tu experiencia y administra tus categorías
          </p>
        </div>
        <Button onClick={handleNew} size="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Color del Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
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
                onClick={() => {
                  setColor(option.value)
                  toast({
                    title: 'Tema actualizado',
                    description: `Tema ${option.name} aplicado correctamente`
                  })
                }}
                className={cn(
                  "group relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all hover:scale-105",
                  color === option.value
                    ? "border-primary shadow-lg bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div
                  className={cn(
                    "h-16 w-full rounded-md bg-gradient-to-r shadow-md transition-transform group-hover:scale-105",
                    option.gradient
                  )}
                />
                <span className="text-sm font-medium">{option.name}</span>
                {color === option.value && (
                  <Badge variant="default" className="absolute -top-2 -right-2">
                    <Sparkles className="h-3 w-3" />
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Categorías de Gastos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-rose-600" />
            Categorías de Gastos
          </CardTitle>
          <CardDescription>
            Administra las categorías para tus gastos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingExpenses ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseCategories.map((category: any) => (
                <div
                  key={category.id}
                  className="group flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all"
                  style={{ borderLeft: `4px solid ${category.color}` }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div 
                      className="flex items-center justify-center h-10 w-10 rounded-full text-xl"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {category.icon}
                    </div>
                    <span className="font-medium truncate">{category.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {expenseCategories.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay categorías de gastos</p>
                  <p className="text-sm mt-1">Crea una nueva categoría para empezar</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categorías de Ingresos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Categorías de Ingresos
          </CardTitle>
          <CardDescription>
            Administra las categorías para tus ingresos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingIncome ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomeCategories.map((category: any) => (
                <div
                  key={category.id}
                  className="group flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all"
                  style={{ borderLeft: `4px solid ${category.color}` }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div 
                      className="flex items-center justify-center h-10 w-10 rounded-full text-xl"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {category.icon}
                    </div>
                    <span className="font-medium truncate">{category.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {incomeCategories.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay categorías de ingresos</p>
                  <p className="text-sm mt-1">Crea una nueva categoría para empezar</p>
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
