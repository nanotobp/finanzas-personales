'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSignup} className="mt-8 space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Nombre completo</Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="mt-1"
            placeholder="Juan Pérez"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1"
            placeholder="••••••••"
            minLength={6}
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/login')}
          className="w-full"
        >
          Ya tengo cuenta
        </Button>
      </div>
    </form>
  )
}
