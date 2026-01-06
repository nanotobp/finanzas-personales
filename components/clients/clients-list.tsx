'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tantml/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Users, UserCheck, DollarSign, Pencil, Trash2, LayoutGrid, Table, AlertTriangle } from 'lucide-react'
import { ClientFormDialog } from './client-form-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function ClientsList() {
  const supabase = createClient()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [clientToDelete, setClientToDelete] = useState<any>(null)

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .order('name')

      return data || []
    },
    staleTime: 3 * 60 * 1000, // Cache por 3 minutos
  })

  // Obtener o crear el cliente "Varios"
  const getVariousClient = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // Buscar cliente "Varios" existente
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Varios')
      .single()

    if (existing) return existing.id

    // Si no existe, crearlo
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: 'Varios',
        type: 'occasional',
        email: 'varios@sistema.local',
        notes: 'Cliente por defecto para facturas sin cliente específico',
        is_active: true,
      })
      .select('id')
      .single()

    if (error) throw error
    return newClient.id
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Obtener o crear el cliente "Varios"
      const variousClientId = await getVariousClient()

      // Primero, transferir todas las facturas al cliente "Varios"
      const { error: invoicesError } = await supabase
        .from('invoices')
        .update({ client_id: variousClientId })
        .eq('client_id', id)

      if (invoicesError) throw invoicesError

      // Luego, eliminar el cliente
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setClientToDelete(null)
      toast({
        title: 'Cliente eliminado',
        description: 'El cliente ha sido eliminado y sus facturas transferidas a "Varios".',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el cliente.',
        variant: 'destructive',
      })
    },
  })

  const activeClients = clients?.filter(c => c.is_active) || []
  const fixedClients = clients?.filter(c => c.type === 'fixed' && c.is_active) || []
  const totalMonthlyIncome = fixedClients.reduce((sum, c) => sum + (Number(c.monthly_amount) || 0), 0)

  const clientTypeLabels: Record<string, string> = {
    fixed: 'Fijo',
    occasional: 'Ocasional',
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ingresos Mensuales Fijos
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-50">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalMonthlyIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clientes Activos
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50">
              <UserCheck className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeClients.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Clientes
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-50">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {clients?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Clientes</CardTitle>
          <div className="flex gap-2">
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-r-none"
              >
                <Table className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-l-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <ClientFormDialog />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : viewMode === 'table' ? (
            <TableComponent>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-right">Monto Mensual</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients?.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        {client.ruc && (
                          <div className="text-xs text-muted-foreground">RUC: {client.ruc}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.type === 'fixed' ? 'default' : 'secondary'}>
                        {clientTypeLabels[client.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {client.contact_name && <div className="font-medium">{client.contact_name}</div>}
                        {client.email && <div className="text-muted-foreground">{client.email}</div>}
                        {client.phone && <div className="text-muted-foreground">{client.phone}</div>}
                        {!client.contact_name && !client.email && !client.phone && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {client.type === 'fixed' && client.monthly_amount ? (
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(client.monthly_amount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.is_active ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <ClientFormDialog
                          client={client}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setClientToDelete(client)}
                          disabled={client.name === 'Varios'}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableComponent>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients?.map((client) => (
                <Card key={client.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{client.name}</h3>
                          {!client.is_active && (
                            <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {clientTypeLabels[client.type]}
                        </p>
                      </div>
                    </div>

                    {client.type === 'fixed' && client.monthly_amount && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600">Monto mensual</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(client.monthly_amount)}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      {client.ruc && (
                        <div>
                          <span className="text-gray-600">RUC:</span>{' '}
                          <span className="font-medium">{client.ruc}</span>
                        </div>
                      )}
                      {client.contact_name && (
                        <div>
                          <span className="text-gray-600">Contacto:</span>{' '}
                          <span className="font-medium">{client.contact_name}</span>
                        </div>
                      )}
                      {client.email && (
                        <div>
                          <span className="text-gray-600">Email:</span>{' '}
                          <span className="font-medium">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div>
                          <span className="text-gray-600">Teléfono:</span>{' '}
                          <span className="font-medium">{client.phone}</span>
                        </div>
                      )}
                      {client.address && (
                        <div>
                          <span className="text-gray-600">Dirección:</span>{' '}
                          <span className="text-gray-700">{client.address}</span>
                        </div>
                      )}
                      {client.notes && (
                        <div>
                          <span className="text-gray-600">Notas:</span>{' '}
                          <span className="text-gray-700">{client.notes}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <ClientFormDialog
                        client={client}
                        trigger={
                          <Button variant="outline" size="sm" className="flex-1">
                            <Pencil className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClientToDelete(client)}
                        disabled={deleteMutation.isPending || client.name === 'Varios'}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {(!clients || clients.length === 0) && !isLoading && (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No hay clientes registrados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de confirmación para eliminar */}
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              ¿Eliminar este cliente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar a <strong>{clientToDelete?.name}</strong>.
              {' '}Esta acción no se puede deshacer.
              <br /><br />
              Las facturas asociadas a este cliente se transferirán automáticamente al cliente "Varios" para mantener la integridad de tus registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clientToDelete && deleteMutation.mutate(clientToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
