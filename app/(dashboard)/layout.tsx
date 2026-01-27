import { Navigate, Outlet } from 'react-router-dom'
import { DashboardLayoutSelector } from '@/components/dashboard/dashboard-layout-selector'
import { useAuth } from '@/hooks/use-auth'

export default function DashboardLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Cargando...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <DashboardLayoutSelector user={{ email: user.email }}>
      <Outlet />
    </DashboardLayoutSelector>
  )
}
