'use client'

import { useState, useEffect } from 'react'
import { DashboardLayoutClean } from '@/components/dashboard/dashboard-layout-clean'
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client'
import { useIsMobile } from '@/hooks/use-is-mobile'

interface DashboardLayoutSelectorProps {
  children: React.ReactNode
  user: {
    email?: string
  }
}

export function DashboardLayoutSelector({ children, user }: DashboardLayoutSelectorProps) {
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Evitar flash de contenido durante la carga
  if (!mounted) {
    return null
  }

  // PWA para móviles, Dashboard normal para desktop
  if (isMobile) {
    return (
      <DashboardLayoutClean user={user}>
        {children}
      </DashboardLayoutClean>
    )
  }

  return (
    <DashboardLayoutClient user={user}>
      {children}
    </DashboardLayoutClient>
  )
}
