'use client'

import { InvoiceFormDialog } from '@/components/invoices/invoice-form-dialog'
import { ArrowLeft, FilePlus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function NewInvoicePage() {
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

      <Card>
        <CardHeader>
          <CardTitle>Nueva Factura</CardTitle>
          <CardDescription>
            Completa los datos para generar una factura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceFormDialog 
            trigger={
              <Button size="lg" className="w-full">
                <FilePlus className="mr-2 h-5 w-5" />
                Crear Factura
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
