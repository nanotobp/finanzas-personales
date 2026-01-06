import { TaxSummary } from '@/components/taxes/tax-summary'
import { TaxSettings } from '@/components/taxes/tax-settings'

export default function TaxesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Impuestos (Paraguay)</h1>
        <p className="text-gray-600 mt-1">
          Gestiona IVA e IRP - Resumen fiscal y configuración
        </p>
      </div>

      <TaxSummary />
      
      <TaxSettings />
    </div>
  )
}
