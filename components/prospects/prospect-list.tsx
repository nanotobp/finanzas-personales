'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/lib/utils'
import { MoreVertical, Search, Phone, Mail, Calendar, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { useState, useMemo, useCallback, memo } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ProspectListProps {
  onEdit: (prospect: any) => void
}

const statusConfig = {
  lead: { label: 'Prospecto', color: 'bg-gray-500' },
  contacted: { label: 'Contactado', color: 'bg-blue-500' },
  meeting: { label: 'Reunión', color: 'bg-purple-500' },
  proposal: { label: 'Propuesta', color: 'bg-yellow-500' },
  negotiation: { label: 'Negociación', color: 'bg-orange-500' },
  won: { label: 'Ganado', color: 'bg-green-500' },
  lost: { label: 'Perdido', color: 'bg-red-500' },
}

const priorityConfig = {
  low: { label: 'Baja', color: 'text-gray-500' },
  medium: { label: 'Media', color: 'text-yellow-600' },
  high: { label: 'Alta', color: 'text-red-600' },
}

const temperatureConfig = {
  cold: { label: '❄️ Frío', color: 'text-blue-400' },
  warm: { label: '🌤️ Tibio', color: 'text-yellow-500' },
  hot: { label: '🔥 Caliente', color: 'text-red-500' },
}

function ProspectListComponent({ onEdit }: ProspectListProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prospects')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
      toast({ title: 'Prospecto eliminado correctamente' })
    },
  })

  const convertToClientMutation = useMutation({
    mutationFn: async (prospect: any) => {
      // Crear cliente
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: prospect.company || prospect.name,
          email: prospect.email,
          phone: prospect.phone,
          contact_person: prospect.name,
          notes: prospect.notes,
        })
        .select()
        .single()

      if (clientError) throw clientError

      // Actualizar prospecto
      const { error: updateError } = await supabase
        .from('prospects')
        .update({
          status: 'won',
          won_date: new Date().toISOString(),
          converted_to_client_id: client.id,
          converted_at: new Date().toISOString(),
        })
        .eq('id', prospect.id)

      if (updateError) throw updateError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast({ title: '✅ Convertido a cliente exitosamente' })
    },
  })

  const filteredProspects = prospects?.filter(prospect => {
    const matchesSearch = 
      prospect.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || prospect.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return <div className="text-center py-8">Cargando prospectos...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Lista de Prospectos</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border rounded-md text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / Empresa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Monto Potencial</TableHead>
                <TableHead>Probabilidad</TableHead>
                <TableHead>Temperatura</TableHead>
                <TableHead>Próximo Contacto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProspects && filteredProspects.length > 0 ? (
                filteredProspects.map((prospect) => (
                  <TableRow key={prospect.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{prospect.name}</p>
                        {prospect.company && (
                          <p className="text-sm text-gray-500">{prospect.company}</p>
                        )}
                        <div className="flex gap-2 mt-1">
                          {prospect.email && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {prospect.email}
                            </span>
                          )}
                          {prospect.phone && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {prospect.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig[prospect.status as keyof typeof statusConfig].color} text-white`}>
                        {statusConfig[prospect.status as keyof typeof statusConfig].label}
                      </Badge>
                      {prospect.priority === 'high' && (
                        <Badge variant="outline" className="ml-1 text-red-600 border-red-600">
                          ⚡ Alta
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(prospect.potential_amount || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${prospect.probability || 50}%` }}
                          />
                        </div>
                        <span className="text-sm">{prospect.probability || 50}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={temperatureConfig[prospect.temperature as keyof typeof temperatureConfig]?.color || ''}>
                        {temperatureConfig[prospect.temperature as keyof typeof temperatureConfig]?.label || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {prospect.next_contact_date && (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {new Date(prospect.next_contact_date).toLocaleDateString('es-ES')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(prospect)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {prospect.status !== 'won' && (
                            <DropdownMenuItem onClick={() => convertToClientMutation.mutate(prospect)}>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Convertir a Cliente
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(prospect.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No hay prospectos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// Export con nombre para que funcione el barrel file
export { ProspectListComponent as ProspectList }
