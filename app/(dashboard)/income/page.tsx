import { IncomeList } from '@/components/income/income-list'
import { IncomeSummary } from '@/components/income/income-summary'

export default function IncomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ingresos</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tus ingresos y clientes
        </p>
      </div>
      <IncomeSummary />
      <IncomeList />
    </div>
  )
}
