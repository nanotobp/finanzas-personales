'use client'

import { useEffect } from 'react'
import { PWAInstallPrompt } from './pwa-install-prompt'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          })

          console.log('Service Worker registrado:', registration.scope)

          // Verificar actualizaciones cada 60 segundos
          setInterval(() => {
            registration.update()
          }, 60000)

          // Escuchar actualizaciones del service worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (!newWorker) return

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Hay una nueva versión disponible
                if (confirm('Hay una nueva versión disponible. ¿Actualizar ahora?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' })
                  window.location.reload()
                }
              }
            })
          })
        } catch (error) {
          console.error('Error registrando Service Worker:', error)
        }
      })
    }

    // Detectar cuando vuelve la conexión para sincronizar
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection?.addEventListener('change', () => {
        if (navigator.onLine) {
          console.log('Conexión restaurada, sincronizando...')
          // Aquí se puede disparar sincronización manual si es necesario
        }
      })
    }

    // Escuchar cambios en el estado de la red
    window.addEventListener('online', () => {
      console.log('App online')
      // Intentar sincronizar datos pendientes
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          return (registration as any).sync.register('sync-receipts')
        })
      }
    })

    window.addEventListener('offline', () => {
      console.log('App offline - los datos se sincronizarán cuando vuelvas a estar online')
    })
  }, [])

  return (
    <>
      {children}
      <PWAInstallPrompt />
    </>
  )
}
