'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ReceiptUploadMobile } from '@/components/receipt-upload-mobile'
import { Camera, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface QuickAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickAddDialog({ open, onOpenChange }: QuickAddDialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { toast } = useToast()
  
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [showReceiptUpload, setShowReceiptUpload] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories', type],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('type', type)
        .order('name')
      return data || []
    },
  })

  // Fetch accounts
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('name')
      return data || []
    },
  })

  const createTransaction = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type,
        amount: parseFloat(amount),
        description,
        category_id: categoryId || null,
        account_id: accountId || null,
        date,
        status: 'pending',
        receipt_url: receiptUrl,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      onOpenChange(false)
      resetForm()
      router.refresh()
    },
  })

  const handleReceiptUpload = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Subir a Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('receipts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)

      setReceiptUrl(publicUrl)
      setShowReceiptUpload(false)

      toast({
        title: 'Factura subida',
        description: 'La imagen se adjuntará al gasto',
      })
    } catch (error) {
      console.error('Error uploading receipt:', error)
      toast({
        title: 'Error',
        description: 'No se pudo subir la factura',
        variant: 'destructive',
      })
      throw error
    }
  }

  const resetForm = () => {
    setAmount('')
    setDescription('')
    setCategoryId('')
    setAccountId('')
    setDate(new Date().toISOString().split('T')[0])
    setReceiptUrl(null)
    setShowReceiptUpload(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTransaction.mutate()
  }

  // Mostrar componente de subida de factura si está activo
  if (showReceiptUpload) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <ReceiptUploadMobile
            onUpload={handleReceiptUpload}
            onCancel={() => setShowReceiptUpload(false)}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Quick Add</DialogTitle>
          <DialogDescription>
            Registra un gasto o ingreso rápidamente. Presiona ⌘K para abrir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              onClick={() => setType('expense')}
              className="flex-1"
            >
              Gasto
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              onClick={() => setType('income')}
              className="flex-1"
            >
              Ingreso
            </Button>
          </div>

          <div>
            <Label htmlFor="amount">Monto *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Compra supermercado"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="account">Cuenta</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una cuenta" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Fecha *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {type === 'expense' && (
            <div>
              <Label>Factura</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReceiptUpload(true)}
                  className="flex-1"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {receiptUrl ? 'Cambiar factura' : 'Subir factura'}
                </Button>
                {receiptUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setReceiptUrl(null)}
                  >
                    <ImageIcon className="h-4 w-4 text-green-600" />
                  </Button>
                )}
              </div>
              {receiptUrl && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Factura adjunta
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTransaction.isPending}
              className="flex-1"
            >
              {createTransaction.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
