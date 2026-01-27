import { Navigate } from 'react-router-dom'

export default function CashFlowPage() {
  // Redirigir a la nueva página unificada
  return <Navigate to="/flow?tab=waterfall" replace />
}
