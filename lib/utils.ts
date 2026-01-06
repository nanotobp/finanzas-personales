import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'PYG') {
  if (currency === 'PYG') {
    return `Gs. ${Math.round(amount).toLocaleString('es-PY')}`
  }
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('es-PY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatShortDate(date: Date | string) {
  return new Date(date).toLocaleDateString('es-PY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
