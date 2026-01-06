'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { PWAProvider } from '@/components/pwa-provider'

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
        <PWAProvider>
          {children}
          <Toaster />
        </PWAProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
