import { redirect } from 'next/navigation'

export default function CashFlowPage() {
  // Redirigir a la nueva página unificada
  redirect('/flow?tab=waterfall')
}
