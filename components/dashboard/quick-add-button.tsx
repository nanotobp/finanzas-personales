'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuickAddDialog } from './quick-add-dialog'
import { useSidebarPreferences, colorGradients } from '@/hooks/use-sidebar-preferences'
import { cn } from '@/lib/utils'

export function QuickAddButton() {
  const [open, setOpen] = useState(false)
  const { color } = useSidebarPreferences()
  const gradient = colorGradients[color as keyof typeof colorGradients] || colorGradients.violet

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className={cn(
          "fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg hover:shadow-xl z-50 border-0 bg-gradient-to-r",
          gradient,
          "hover:opacity-90 transition-all"
        )}
        aria-label="Agregar transacción rápida"
      >
        <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
      </Button>
      <QuickAddDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
