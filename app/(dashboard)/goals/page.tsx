import { SmartGoalsTracker } from '@/components/goals/smart-goals-tracker'

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Objetivos SMART</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Objetivos Específicos, Medibles, Alcanzables, Relevantes y con Tiempo definido
        </p>
      </div>
      <SmartGoalsTracker />
    </div>
  )
}
