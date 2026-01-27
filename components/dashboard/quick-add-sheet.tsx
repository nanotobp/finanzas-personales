'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { useToast } from '@/hooks/use-toast'
import { ArrowDownCircle, ArrowUpCircle, Upload, Camera, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

interface QuickAddSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickAddSheet({ open, onOpenChange }: QuickAddSheetProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { toast } = useToast()
  const { userId } = useAuth()
  
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories', type],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('name')
      return data || []
    },
    enabled: open && !!userId,
  })

  // Fetch accounts
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name')
      return data || []
    },
    enabled: open && !!userId,
  })

  const resetForm = () => {
    setAmount('')
    setDescription('')
    setCategoryId('')
    setAccountId('')
    setDate(new Date().toISOString().split('T')[0])
    setReceiptFile(null)
    setReceiptUrl(null)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setReceiptFile(file)
    setUploadingReceipt(true)

    try {
      if (!userId) throw new Error('No user')

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      const { error: uploadError, data } = await supabase.storage
        .from('receipts')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)

      setReceiptUrl(publicUrl)
      
      toast({
        title: 'Recibo cargado',
        description: 'El recibo se ha subido correctamente',
      })
    } catch (error) {
      console.error('Error uploading receipt:', error)
      toast({
        title: 'Error',
        description: 'No se pudo subir el recibo',
        variant: 'destructive',
      })
    } finally {
      setUploadingReceipt(false)
    }
  }

  const handleRemoveReceipt = () => {
    setReceiptFile(null)
    setReceiptUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un monto válido',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (!userId) throw new Error('No user')

      const { error } = await supabase.from('transactions').insert({
        user_id: userId,
        type,
        amount: parseFloat(amount),
        description: description || `${type === 'expense' ? 'Gasto' : 'Ingreso'} rápido`,
        category_id: categoryId || null,
        account_id: accountId || null,
        date,
        status: 'completed',
        receipt_url: receiptUrl,
      })

      if (error) throw error

      toast({
        title: '¡Éxito!',
        description: `${type === 'expense' ? 'Gasto' : 'Ingreso'} registrado correctamente`,
      })

      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['total-balance'] })
      queryClient.invalidateQueries({ queryKey: ['home-budgets'] })
      
      onOpenChange(false)
      resetForm()
      navigate(0)
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast({
        title: 'Error',
        description: 'No se pudo registrar la transacción',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] bg-white dark:bg-slate-900 border-t rounded-t-3xl"
      >
        <SheetHeader className="text-left mb-6">
          <SheetTitle className="text-2xl">Nueva transacción</SheetTitle>
          <SheetDescription>
            Registra un ingreso o gasto rápidamente
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto max-h-[calc(90vh-120px)] pb-4">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all",
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <ArrowDownCircle className="w-5 h-5" />
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all",
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <ArrowUpCircle className="w-5 h-5" />
              Ingreso
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="text-lg h-12"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Compra de supermercado"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
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

          {/* Account */}
          <div className="space-y-2">
            <Label htmlFor="account">Cuenta</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cuenta" />
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

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Receipt Upload - Solo para gastos */}
          {type === 'expense' && (
            <div className="space-y-2">
              <Label>Recibo (opcional)</Label>
              {!receiptFile ? (
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploadingReceipt}
                    />
                    <div className="flex items-center justify-center gap-2 py-3 px-4 border rounded-xl hover:bg-accent transition-colors cursor-pointer">
                      <Upload className="w-5 h-5" />
                      <span className="text-sm">
                        {uploadingReceipt ? 'Subiendo...' : 'Subir archivo'}
                      </span>
                    </div>
                  </label>
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploadingReceipt}
                    />
                    <div className="flex items-center justify-center gap-2 py-3 px-4 border rounded-xl hover:bg-accent transition-colors cursor-pointer">
                      <Camera className="w-5 h-5" />
                    </div>
                  </label>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 border rounded-xl">
                  <Upload className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm flex-1">{receiptFile.name}</span>
                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    className="text-rose-500 hover:text-rose-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
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
              disabled={isSubmitting}
              className={cn(
                "flex-1 font-semibold",
                type === 'expense'
                  ? 'bg-rose-500 hover:bg-rose-600'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              )}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
