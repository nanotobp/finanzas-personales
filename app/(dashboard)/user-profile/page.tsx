'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Lock, MapPin, Save, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function UserProfilePage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    city: '',
    newPassword: ''
  })

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      // Obtener metadata del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      return {
        id: user.id,
        email: user.email || '',
        full_name: profile?.full_name || user.user_metadata?.full_name || '',
        city: profile?.city || user.user_metadata?.city || '',
        created_at: user.created_at
      }
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) throw new Error('No user')

      // Actualizar tabla profiles (con email incluido)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          email: data.email,
          full_name: data.full_name,
          city: data.city,
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      // Actualizar email si cambió
      if (data.email !== user?.email && data.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email
        })
        if (emailError) throw emailError
      }

      // Actualizar contraseña si se proporcionó
      if (data.newPassword && data.newPassword.length >= 6) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.newPassword
        })
        if (passwordError) throw passwordError
      }
    },
    onSuccess: () => {
      // Invalidar caché para refrescar datos inmediatamente
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      
      toast({
        title: '✅ Perfil actualizado',
        description: 'Tus datos se han guardado correctamente',
      })
      setIsEditing(false)
      setFormData(prev => ({ ...prev, newPassword: '' }))
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: '❌ Error al actualizar',
        description: error.message || 'No se pudo guardar los cambios',
      })
    }
  })

  const handleSave = () => {
    if (!formData.full_name) {
      toast({
        variant: 'destructive',
        title: '⚠️ Campo requerido',
        description: 'El nombre es obligatorio',
      })
      return
    }

    if (!formData.email) {
      toast({
        variant: 'destructive',
        title: '⚠️ Campo requerido',
        description: 'El email es obligatorio',
      })
      return
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: '⚠️ Contraseña muy corta',
        description: 'La contraseña debe tener al menos 6 caracteres',
      })
      return
    }

    updateProfileMutation.mutate(formData)
  }

  const handleEdit = () => {
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      city: user?.city || '',
      newPassword: ''
    })
    setIsEditing(true)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Mi Perfil</h1>
        <p className="text-slate-600 mt-1">Administra tu información personal</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </span>
            {!isEditing && (
              <Button onClick={handleEdit} variant="outline" size="sm">
                Editar
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            {isEditing ? 'Actualiza tus datos personales' : 'Tu información de usuario'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nombre completo */}
          <div className="space-y-2">
            <Label htmlFor="full_name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Nombre completo
            </Label>
            {isEditing ? (
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Tu nombre completo"
              />
            ) : (
              <p className="text-lg font-medium">{user?.full_name || 'No especificado'}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </Label>
            {isEditing ? (
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="tu@email.com"
              />
            ) : (
              <p className="text-lg font-medium">{user?.email}</p>
            )}
          </div>

          {/* Ciudad */}
          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Ciudad
            </Label>
            {isEditing ? (
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Tu ciudad"
              />
            ) : (
              <p className="text-lg font-medium">{user?.city || 'No especificado'}</p>
            )}
          </div>

          {/* Nueva contraseña (solo en modo edición) */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Nueva contraseña (opcional)
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Déjalo en blanco si no quieres cambiar la contraseña
              </p>
            </div>
          )}

          {/* Fecha de registro */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Miembro desde: {new Date(user?.created_at || '').toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {/* Botones de acción */}
          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSave} 
                disabled={updateProfileMutation.isPending}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false)
                  setFormData({ full_name: '', email: '', city: '', newPassword: '' })
                }}
                disabled={updateProfileMutation.isPending}
              >
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
