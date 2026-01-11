'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Building2, Phone, Mail, Calendar, DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useState, useCallback, memo } from 'react'

interface ProspectKanbanProps {
  onEdit: (prospect: any) => void
}

const columns = [
  { id: 'lead', title: 'Prospecto', color: 'border-gray-300' },
  { id: 'contacted', title: 'Contactado', color: 'border-blue-300' },
  { id: 'meeting', title: 'Reunión', color: 'border-purple-300' },
  { id: 'proposal', title: 'Propuesta', color: 'border-yellow-300' },
  { id: 'negotiation', title: 'Negociación', color: 'border-orange-300' },
  { id: 'won', title: 'Ganado ✓', color: 'border-green-300' },
  { id: 'lost', title: 'Perdido ✗', color: 'border-red-300' },
]

const temperatureEmojis = {
  cold: '❄️',
  warm: '🌤️',
  hot: '🔥',
}

function ProspectKanbanComponent({ onEdit }: ProspectKanbanProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [draggedProspect, setDraggedProspect] = useState<any>(null)

  const { data: prospects, isLoading } = useQuery({
    queryKey: ['prospects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status }
      
      // Si se marca como ganado/perdido, agregar fecha
      if (status === 'won') {
        updateData.won_date = new Date().toISOString()
      } else if (status === 'lost') {
        updateData.lost_date = new Date().toISOString()
      }

      const { error } = await supabase
        .from('prospects')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
      toast({ title: 'Estado actualizado' })
    },
  })

  const handleDragStart = (prospect: any) => {
    setDraggedProspect(prospect)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (status: string) => {
    if (draggedProspect) {
      updateStatusMutation.mutate({
        id: draggedProspect.id,
        status,
      })
      setDraggedProspect(null)
    }
  }

  const getProspectsByStatus = (status: string) => {
    return prospects?.filter(p => p.status === status) || []
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
        {columns.map((column) => {
          const columnProspects = getProspectsByStatus(column.id)
          const totalValue = columnProspects.reduce((sum, p) => sum + Number(p.potential_amount || 0), 0)

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              <Card className={`border-t-4 ${column.color}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {column.title}
                      <Badge variant="outline" className="ml-2">
                        {columnProspects.length}
                      </Badge>
                    </CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(totalValue)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                  {columnProspects.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      Sin prospectos
                    </p>
                  ) : (
                    columnProspects.map((prospect) => (
                      <div
                        key={prospect.id}
                        draggable
                        onDragStart={() => handleDragStart(prospect)}
                        onClick={() => onEdit(prospect)}
                        className="p-3 bg-white border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm">{prospect.name}</h4>
                          <span className="text-lg">
                            {temperatureEmojis[prospect.temperature as keyof typeof temperatureEmojis] || '🌤️'}
                          </span>
                        </div>

                        {prospect.company && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Building2 className="w-3 h-3" />
                            {prospect.company}
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-xs font-semibold text-green-600 mb-2">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(prospect.potential_amount || 0)}
                        </div>

                        <div className="space-y-1">
                          {prospect.email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{prospect.email}</span>
                            </div>
                          )}
                          {prospect.phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {prospect.phone}
                            </div>
                          )}
                          {prospect.next_contact_date && (
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                              <Calendar className="w-3 h-3" />
                              {new Date(prospect.next_contact_date).toLocaleDateString('es-ES')}
                            </div>
                          )}
                        </div>

                        {prospect.probability && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Probabilidad</span>
                              <span className="font-semibold">{prospect.probability}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{ width: `${prospect.probability}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {prospect.priority === 'high' && (
                          <Badge variant="destructive" className="mt-2 text-xs">
                            ⚡ Alta Prioridad
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const ProspectKanban = memo(ProspectKanbanComponent)
