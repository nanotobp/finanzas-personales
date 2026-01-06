import { CashFlowWaterfall } from '@/components/analytics/cash-flow-waterfall'
import { BurnRate } from '@/components/analytics/burn-rate'

export default function CashFlowPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Cash Flow</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Análisis detallado de entradas y salidas
        </p>
      </div>

      <div className="grid gap-6">
        <CashFlowWaterfall />
        <BurnRate />
      </div>
    </div>
  )
}
