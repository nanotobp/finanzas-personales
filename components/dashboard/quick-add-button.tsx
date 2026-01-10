'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { QuickAddDialog } from './quick-add-dialog'

export function QuickAddButton() {
  const [open, setOpen] = useState(false)

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
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
        aria-label="Agregar transacción rápida"
      >
        <Plus className="h-7 w-7 transition-transform group-hover:rotate-90" strokeWidth={2.5} />
      </button>
      <QuickAddDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
