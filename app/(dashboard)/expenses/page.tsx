import { ExpensesList } from '@/components/expenses/expenses-list'

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gastos</h1>
        <p className="text-gray-600 mt-1">
          Gestiona todos tus gastos
        </p>
      </div>
      <ExpensesList />
    </div>
  )
}
