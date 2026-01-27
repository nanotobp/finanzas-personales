'use client'

import { GoalsMobile } from '@/components/goals/goals-mobile'
import { GoalsList } from '@/components/goals/goals-list'
import { useIsMobile } from '@/hooks/use-is-mobile'

export default function GoalsPage() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <GoalsMobile />
  }

  return <GoalsList />
}
