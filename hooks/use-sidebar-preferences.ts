'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarPreferences {
  isCollapsed: boolean
  color: string
  toggleCollapsed: () => void
  setColor: (color: string) => void
}

export const useSidebarPreferences = create<SidebarPreferences>()(
  persist(
    (set) => ({
      isCollapsed: false,
      color: 'violet', // violet, blue, green, orange, pink
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setColor: (color: string) => set({ color }),
    }),
    {
      name: 'sidebar-preferences',
    }
  )
)

export const colorGradients = {
  violet: 'from-violet-600 to-purple-600',
  blue: 'from-blue-600 to-indigo-600',
  green: 'from-emerald-600 to-teal-600',
  orange: 'from-orange-600 to-red-600',
  pink: 'from-pink-600 to-rose-600',
  slate: 'from-slate-700 to-slate-900',
}
