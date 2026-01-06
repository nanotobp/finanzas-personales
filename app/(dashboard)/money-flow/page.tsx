import { MoneyFlowSankey } from '@/components/analytics/money-flow-sankey'
import { TopMerchants } from '@/components/analytics/top-merchants'

export default function MoneyFlowPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Flujo de Dinero</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Visualiza hacia dónde va cada peso
        </p>
      </div>

      <div className="grid gap-6">
        <MoneyFlowSankey />
        <TopMerchants />
      </div>
    </div>
  )
}
