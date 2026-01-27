'use client'

import { SubscriptionsMobile } from '@/components/subscriptions/subscriptions-mobile'
import { SubscriptionsList } from '@/components/subscriptions/subscriptions-list'
import { useIsMobile } from '@/hooks/use-is-mobile'

export default function SubscriptionsPage() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <SubscriptionsMobile />
  }

  return <SubscriptionsList />
}
