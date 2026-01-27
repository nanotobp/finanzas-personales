'use client'

import { InvoicesDue } from '@/components/dashboard/invoices-due'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function InvoicesDuePage() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  useEffect(() => {
    // En desktop, redirigir a la página normal de facturas
    if (!isMobile) {
      navigate('/invoices?filter=pending')
    }
  }, [isMobile, router])

  // Si no es móvil, no renderizar nada
  if (!isMobile) {
    return null
  }

  return <InvoicesDue />
}
