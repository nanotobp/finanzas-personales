'use client'

import { InvoicesDue } from '@/components/dashboard/invoices-due'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InvoicesDuePage() {
  const isMobile = useIsMobile()
  const router = useRouter()

  useEffect(() => {
    // En desktop, redirigir a la página normal de facturas
    if (!isMobile) {
      router.push('/invoices?filter=pending')
    }
  }, [isMobile, router])

  // Si no es móvil, no renderizar nada
  if (!isMobile) {
    return null
  }

  return <InvoicesDue />
}
