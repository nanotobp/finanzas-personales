'use client'

import { useEffect } from 'react'

export default function ClearCachePage() {
  useEffect(() => {
    // Limpiar localStorage del sidebar
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sidebar-preferences')
      localStorage.removeItem('sidebar-collapsed')
      localStorage.removeItem('sidebar-color')
      
      // Recargar la página
      window.location.href = '/dashboard'
    }
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Limpiando caché...</h1>
        <p className="text-muted-foreground">Redirigiendo al dashboard...</p>
      </div>
    </div>
  )
}
