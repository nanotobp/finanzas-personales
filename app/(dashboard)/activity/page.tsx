import { ActivityHeatmap } from '@/components/analytics/activity-heatmap'
import { SpendingByDayOfWeek } from '@/components/analytics/spending-by-day'

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Actividad Financiera</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Patrones de gasto por día y hora
        </p>
      </div>

      <div className="grid gap-6">
        <ActivityHeatmap />
        <SpendingByDayOfWeek />
      </div>
    </div>
  )
}
