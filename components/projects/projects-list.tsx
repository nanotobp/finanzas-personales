'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, getMonthEndDate } from '@/lib/utils'
import { FolderKanban, TrendingUp, TrendingDown, Plus, Pencil, Trash2 } from 'lucide-react'
import { ProjectFormDialog } from './project-form-dialog'
import { useAuth } from '@/hooks/use-auth'

export function ProjectsList() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { userId } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const currentMonth = new Date().toISOString().slice(0, 7)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', currentMonth],
    queryFn: async () => {
      if (!userId) return []
      const startDate = `${currentMonth}-01`
      const endDate = getMonthEndDate(currentMonth)

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('name')

      // Get income and expenses for each project
      const projectsWithStats = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { data: income } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('type', 'income')
            .eq('project_id', project.id)
            .gte('date', startDate)
            .lte('date', endDate)

          const { data: expenses } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('type', 'expense')
            .eq('project_id', project.id)
            .gte('date', startDate)
            .lte('date', endDate)

          const totalIncome = income?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
          const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
          const profit = totalIncome - totalExpenses

          return {
            ...project,
            totalIncome,
            totalExpenses,
            profit,
          }
        })
      )

      return projectsWithStats
    },
    enabled: !!userId,
  })

  const activeProjects = projects?.filter(p => p.is_active) || []
  const totalProfit = projects?.reduce((sum, p) => sum + (p.profit || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rentabilidad Total
            </CardTitle>
            <div className={`p-2 rounded-lg ${totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              {totalProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Proyectos Activos
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50">
              <FolderKanban className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeProjects.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Proyectos
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-50">
              <FolderKanban className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {projects?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Proyectos</CardTitle>
            <Button onClick={() => {setSelectedProject(null); setDialogOpen(true)}}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects?.map((project) => (
                <Card key={project.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{project.name}</h3>
                            {!project.is_active && (
                              <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                                Inactivo
                              </span>
                            )}
                          </div>
                          {project.description && (
                            <p className="text-sm text-gray-500">{project.description}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600">Ingresos</p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(project.totalIncome)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Gastos</p>
                          <p className="font-semibold text-red-600">
                            {formatCurrency(project.totalExpenses)}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <p className="text-xs text-gray-600 mb-1">Rentabilidad del mes</p>
                        <p className={`text-xl font-bold ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {project.profit >= 0 ? '+' : ''}{formatCurrency(project.profit)}
                        </p>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {setSelectedProject(project); setDialogOpen(true)}}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('¿Eliminar este proyecto?')) {
                              deleteMutation.mutate(project.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {(!projects || projects.length === 0) && !isLoading && (
            <div className="text-center py-12 text-gray-500">
              <FolderKanban className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No hay proyectos registrados</p>
              <Button onClick={() => {setSelectedProject(null); setDialogOpen(true)}} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Proyecto
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={selectedProject}
      />
    </div>
  )
}
