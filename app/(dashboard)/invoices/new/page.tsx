'use client'

import { InvoiceFormDialog } from '@/components/invoices/invoice-form-dialog'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewInvoicePage() {
  const [isOpen, setIsOpen] = useState(true)
  const router = useRouter()

  const handleClose = () => {
    setIsOpen(false)
    router.push('/invoices')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Generar factura</h1>
          <p className="text-gray-600 mt-1">
            Crea una nueva factura para tus clientes
          </p>
        </div>
      </div>

      <InvoiceFormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={handleClose}
      />
    </div>
  )
}
