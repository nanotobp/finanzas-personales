'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Wallet, TrendingUp, TrendingDown, Plus, Pencil, Trash2, LayoutGrid, Table } from 'lucide-react'
import { AccountFormDialog } from './account-form-dialog'
import { TransferDialog } from './transfer-dialog'
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'

export function AccountsList() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { userId } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      if (!userId) return []
      const { data } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('name')
      return data || []
    },
    enabled: !!userId,
  })

  const totalBalance = accounts?.reduce((sum, a) => sum + Number(a.balance), 0) || 0
  const activeAccounts = accounts?.filter(a => a.is_active) || []

  const accountTypeLabels: Record<string, string> = {
    cash: 'Efectivo',
    checking: 'Cuenta Corriente',
    savings: 'Ahorros',
    investment: 'Inversión',
  }

  const accountTypeIcons: Record<string, any> = {
    cash: Wallet,
    checking: TrendingUp,
    savings: TrendingDown,
    investment: TrendingUp,
  }

  const handleEdit = (account: any) => {
    setSelectedAccount(account)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta cuenta?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleNewAccount = () => {
    setSelectedAccount(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resumen de Cuentas</CardTitle>
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
              <TransferDialog />
              <Button onClick={handleNewAccount}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cuenta
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Saldo Total</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalBalance)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Cuentas Activas</p>
              <p className="text-2xl font-bold text-green-600">{activeAccounts.length}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Cuentas</p>
              <p className="text-2xl font-bold text-purple-600">{accounts?.length || 0}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : viewMode === 'table' ? (
            <TableComponent>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts?.map((account) => {
                  const Icon = accountTypeIcons[account.type] || Wallet
                  return (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-medium">{account.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{accountTypeLabels[account.type]}</TableCell>
                      <TableCell>{account.currency}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold ${
                          Number(account.balance) >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatCurrency(account.balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {account.is_active ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400">
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactiva</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(account)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(account.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </TableComponent>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts?.map((account) => {
                const Icon = accountTypeIcons[account.type] || Wallet
                return (
                  <Card key={account.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        {!account.is_active && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            Inactiva
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{account.name}</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {accountTypeLabels[account.type]}
                      </p>
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600 mb-1">Saldo</p>
                        <p className={`text-2xl font-bold ${
                          Number(account.balance) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(account.balance)}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(account)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(account.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {(!accounts || accounts.length === 0) && !isLoading && (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No hay cuentas registradas</p>
              <Button onClick={handleNewAccount} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Cuenta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AccountFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={selectedAccount}
      />
    </div>
  )
}
