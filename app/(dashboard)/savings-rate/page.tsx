import { SavingsRateGauge } from '@/components/analytics/savings-rate-gauge'
import { EmergencyFundCoverage } from '@/components/analytics/emergency-fund-coverage'
import { DebtToIncomeRatio } from '@/components/analytics/debt-to-income-ratio'

export default function SavingsRatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Métricas de Salud Financiera</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Tasa de ahorro, cobertura y deuda
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SavingsRateGauge />
        <EmergencyFundCoverage />
        <DebtToIncomeRatio />
      </div>
    </div>
  )
}
