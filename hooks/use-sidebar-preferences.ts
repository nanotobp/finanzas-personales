'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect } from 'react'

interface SidebarPreferences {
  isCollapsed: boolean
  color: string
  toggleCollapsed: () => void
  setColor: (color: string) => void
}

// Definir colores primarios para cada tema (HSL)
export const themeColors = {
  violet: { h: 258, s: 90, l: 61 }, // violet-600
  blue: { h: 221, s: 83, l: 53 }, // blue-600
  green: { h: 160, s: 84, l: 39 }, // emerald-600
  orange: { h: 25, s: 95, l: 53 }, // orange-600
  pink: { h: 330, s: 81, l: 60 }, // pink-600
  slate: { h: 215, s: 28, l: 17 }, // slate-700
}

export const useSidebarPreferences = create<SidebarPreferences>()(
  persist(
    (set) => ({
      isCollapsed: false,
      color: 'blue',
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setColor: (color: string) => {
        set({ color })
        // Aplicar el color como tema global
        if (typeof window !== 'undefined') {
          const theme = themeColors[color as keyof typeof themeColors]
          if (theme) {
            document.documentElement.style.setProperty('--primary', `${theme.h} ${theme.s}% ${theme.l}%`)
            document.documentElement.style.setProperty('--ring', `${theme.h} ${theme.s}% ${theme.l}%`)
          }
        }
      },
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

// Hook para aplicar el tema al cargar
export function useApplyTheme() {
  const color = useSidebarPreferences((state) => state.color)
  
  useEffect(() => {
    const theme = themeColors[color as keyof typeof themeColors]
    if (theme && typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--primary', `${theme.h} ${theme.s}% ${theme.l}%`)
      document.documentElement.style.setProperty('--ring', `${theme.h} ${theme.s}% ${theme.l}%`)
    }
  }, [color])
}
