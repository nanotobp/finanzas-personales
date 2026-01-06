'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Global error:', error)
    
    // TODO: Send to error tracking service
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error)
    // }
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full px-6 py-8 bg-card rounded-lg shadow-lg border">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <h2 className="text-2xl font-bold">Error Fatal</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Ocurrió un error crítico en la aplicación. Nuestro equipo ha sido notificado.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-4 bg-muted rounded-md">
                <p className="text-sm font-mono text-destructive">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={reset}>Intentar nuevamente</Button>
              <Button onClick={() => window.location.href = '/'} variant="outline">
                Ir al inicio
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
