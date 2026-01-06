import { BudgetsList } from '@/components/budgets/budgets-list'
import { BudgetsSummary } from '@/components/budgets/budgets-summary'

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Presupuestos</h1>
        <p className="text-gray-600 mt-1">
          Configura y monitorea tus presupuestos
        </p>
      </div>
      <BudgetsSummary />
      <BudgetsList />
    </div>
  )
}
