'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { PWAProvider } from '@/components/pwa-provider'
import { useApplyTheme } from '@/hooks/use-sidebar-preferences'

function ThemeApplier({ children }: { children: React.ReactNode }) {
  useApplyTheme()
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos - datos frescos por más tiempo
            gcTime: 10 * 60 * 1000, // 10 minutos - mantener en cache
            refetchOnWindowFocus: false, // No refetch al cambiar tabs
            refetchOnMount: false, // No refetch al montar si hay cache
            retry: 1, // Solo 1 reintento en caso de error
            // Optimizaciones de red
            refetchInterval: false, // Deshabilitar polling automático
            refetchIntervalInBackground: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ThemeApplier>
          <PWAProvider>
            {children}
            <Toaster />
          </PWAProvider>
        </ThemeApplier>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
