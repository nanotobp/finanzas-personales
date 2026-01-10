import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Obtener el último día del mes dado en formato YYYY-MM
export function getMonthEndDate(monthString: string): string {
  const [year, month] = monthString.split('-')
  return new Date(Number(year), Number(month), 0).toISOString().split('T')[0]
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
