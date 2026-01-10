import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatear moneda en guaraníes
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) return '₲ 0'
  
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount)
}

// Formatear fecha corta
export function formatShortDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-PY', {
    day: '2-digit',
    month: 'short',
  }).format(dateObj)
}
