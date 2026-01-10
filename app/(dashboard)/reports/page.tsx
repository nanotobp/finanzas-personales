import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy loading con suspense para optimizar bundle
const ReportsView = dynamic(
  () => import('@/components/reports/reports-view').then(mod => ({ default: mod.ReportsView })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    ),
    ssr: false
  }
)

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-1">
          Análisis y exportación de datos
        </p>
      </div>
      <ReportsView />
    </div>
  )
}
