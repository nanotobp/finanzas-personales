import { SubscriptionsList } from '@/components/subscriptions/subscriptions-list'

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Suscripciones</h1>
        <p className="text-gray-600 mt-1">
          Controla tus pagos recurrentes
        </p>
      </div>
      <SubscriptionsList />
    </div>
  )
}
