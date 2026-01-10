import { InvoicesList } from '@/components/invoices/invoices-list'

export default function InvoicesPage() {
  return (
    <div className="space-y-6 px-4 py-6 md:px-0 md:py-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Seguimiento de Cobros</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Gestiona las facturas y pagos de tus clientes
        </p>
      </div>
      <InvoicesList />
    </div>
  )
}
