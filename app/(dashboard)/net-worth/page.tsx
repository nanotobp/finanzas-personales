import { NetWorthChart } from '@/components/analytics/net-worth-chart'
import { NetWorthBreakdown } from '@/components/analytics/net-worth-breakdown'

export default function NetWorthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Patrimonio Neto</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Tu riqueza total: Activos - Pasivos
        </p>
      </div>

      <div className="grid gap-6">
        <NetWorthChart />
        <NetWorthBreakdown />
      </div>
    </div>
  )
}
