import { InvoicesList } from '@/components/invoices/invoices-list'

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seguimiento de Cobros</h1>
        <p className="text-muted-foreground">
          Gestiona las facturas y pagos de tus clientes
        </p>
      </div>
      <InvoicesList />
    </div>
  )
}
