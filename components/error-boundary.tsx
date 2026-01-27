'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service (Sentry, LogRocket, etc.)
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // TODO: Send to error tracking service
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo })
    // }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="max-w-lg mx-auto mt-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle>Algo salió mal</CardTitle>
            </div>
            <CardDescription>
              Ocurrió un error inesperado. Por favor, intenta nuevamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {import.meta.env.DEV && this.state.error && (
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm font-mono text-destructive">
                  {this.state.error.toString()}
                </p>
                {this.state.error.stack && (
                  <pre className="mt-2 text-xs overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={this.resetError} variant="default">
                Intentar nuevamente
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
                Ir al Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
