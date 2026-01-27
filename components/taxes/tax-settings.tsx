'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Receipt, Percent } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export function TaxSettings() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { userId } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['tax-settings'],
    queryFn: async () => {
      if (!userId) throw new Error('No user')

      const { data, error } = await supabase
        .from('tax_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      // Si no existe, retornar valores por defecto
      return data || {
        default_iva_percentage: 10.0,
        default_irp_percentage: 8.0,
        tax_regime: 'simple',
        iva_responsible: false,
        irp_responsible: false,
        ruc: '',
        business_name: '',
      }
    },
    enabled: !!userId,
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!userId) throw new Error('No user')

      const taxData = {
        ...data,
        user_id: userId,
        updated_at: new Date().toISOString(),
      }

      // Verificar si ya existe
      const { data: existing } = await supabase
        .from('tax_settings')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (existing) {
        const { error } = await supabase
          .from('tax_settings')
          .update(taxData)
          .eq('user_id', userId)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('tax_settings')
          .insert([taxData])
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-settings'] })
      setIsEditing(false)
      toast({
        title: 'Configuración guardada',
        description: 'La configuración de impuestos se actualizó correctamente.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const [formData, setFormData] = useState(settings || {})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(formData)
  }

  if (isLoading) {
    return <div>Cargando configuración...</div>
  }

  if (!isEditing && settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Configuración de Impuestos (Paraguay)
          </CardTitle>
          <CardDescription>
            Configuración de IVA e IRP para cálculos automáticos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">RUC</Label>
              <p className="font-medium">{settings.ruc || 'No configurado'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Razón Social</Label>
              <p className="font-medium">{settings.business_name || 'No configurado'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">IVA por defecto</Label>
              <p className="font-medium">{settings.default_iva_percentage}%</p>
            </div>
            <div>
              <Label className="text-muted-foreground">IRP por defecto</Label>
              <p className="font-medium">{settings.default_irp_percentage}%</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Régimen Tributario</Label>
              <p className="font-medium capitalize">{settings.tax_regime || 'simple'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Responsable IVA</Label>
              <p className="font-medium">{settings.iva_responsible ? 'Sí' : 'No'}</p>
            </div>
          </div>
          
          <Button onClick={() => {
            setFormData(settings)
            setIsEditing(true)
          }}>
            Editar Configuración
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Configurar Impuestos
        </CardTitle>
        <CardDescription>
          Configura los impuestos de Paraguay (IVA e IRP)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ruc">RUC</Label>
              <Input
                id="ruc"
                placeholder="12345678-9"
                value={formData.ruc || ''}
                onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_name">Razón Social</Label>
              <Input
                id="business_name"
                placeholder="Mi Empresa S.A."
                value={formData.business_name || ''}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iva_percentage">IVA por Defecto (%)</Label>
              <Input
                id="iva_percentage"
                type="number"
                step="0.1"
                placeholder="10"
                value={formData.default_iva_percentage || 10}
                onChange={(e) => setFormData({ ...formData, default_iva_percentage: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="irp_percentage">IRP por Defecto (%)</Label>
              <Input
                id="irp_percentage"
                type="number"
                step="0.1"
                placeholder="8"
                value={formData.default_irp_percentage || 8}
                onChange={(e) => setFormData({ ...formData, default_irp_percentage: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_regime">Régimen Tributario</Label>
              <Select
                value={formData.tax_regime || 'simple'}
                onValueChange={(value) => setFormData({ ...formData, tax_regime: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simplificado</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="professional">Profesional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="iva_responsible">Responsable de IVA</Label>
                  <p className="text-sm text-muted-foreground">
                    ¿Estás inscripto como responsable de IVA?
                  </p>
                </div>
                <Switch
                  id="iva_responsible"
                  checked={formData.iva_responsible || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, iva_responsible: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="irp_responsible">Sujeto a IRP</Label>
                  <p className="text-sm text-muted-foreground">
                    ¿Debes pagar Impuesto a la Renta Personal?
                  </p>
                </div>
                <Switch
                  id="irp_responsible"
                  checked={formData.irp_responsible || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, irp_responsible: checked })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
