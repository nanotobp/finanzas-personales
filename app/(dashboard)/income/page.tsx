import { IncomeList } from '@/components/income/income-list'

export default function IncomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ingresos por Facturas Pagadas</h1>
        <p className="text-gray-600 mt-1">
          Visualiza tus ingresos de facturas cobradas y otros ingresos varios
        </p>
      </div>
      <IncomeList />
    </div>
  )
}
