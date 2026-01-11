/**
 * Servicio centralizado para queries del dashboard
 * Evita duplicación de código y mejora el performance
 */

import { createClient } from '@/lib/supabase/client'
import { getMonthEndDate } from '@/lib/utils'

export interface MonthlyStats {
  income: number
  expenses: number
  balance: number
  net: number
  invoiceIncome: number
  transactionIncome: number
}

/**
 * Obtiene todas las estadísticas mensuales en una sola llamada optimizada
 * Uso: const stats = await getDashboardStats('2026-01')
 */
export async function getDashboardStats(month: string): Promise<MonthlyStats> {
  const supabase = createClient()
  const startDate = `${month}-01`
  const endDate = getMonthEndDate(month)

  // Una sola Promise.all para todas las queries
  const [transactionsRes, accountsRes, invoicesRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type')
      .gte('date', startDate)
      .lte('date', endDate),
    supabase
      .from('accounts')
      .select('balance')
      .eq('is_active', true),
    supabase
      .from('invoices')
      .select('amount')
      .eq('status', 'paid')
      .not('paid_date', 'is', null)
      .gte('paid_date', startDate)
      .lte('paid_date', endDate)
  ])

  const transactions = transactionsRes.data || []
  const accounts = accountsRes.data || []
  const paidInvoices = invoicesRes.data || []

  const { transactionIncome, expenses } = transactions.reduce(
    (acc, t) => {
      const amount = Number(t.amount)
      if (t.type === 'income') acc.transactionIncome += amount
      else if (t.type === 'expense') acc.expenses += amount
      return acc
    },
    { transactionIncome: 0, expenses: 0 }
  )

  const invoiceIncome = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const income = transactionIncome + invoiceIncome
  const balance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

  return {
    income,
    expenses,
    balance,
    net: income - expenses,
    invoiceIncome,
    transactionIncome
  }
}

/**
 * Obtiene el balance total de todas las cuentas activas
 */
export async function getTotalBalance(): Promise<number> {
  const supabase = createClient()
  const { data } = await supabase
    .from('accounts')
    .select('balance')
    .eq('is_active', true)

  return data?.reduce((sum, a) => sum + Number(a.balance), 0) || 0
}

/**
 * Obtiene ingresos y gastos del mes actual (optimizado)
 */
export async function getCurrentMonthIncomeExpenses(month: string) {
  const supabase = createClient()
  const startDate = `${month}-01`
  const endDate = getMonthEndDate(month)

  const [transactionsRes, invoicesRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type')
      .gte('date', startDate)
      .lte('date', endDate),
    supabase
      .from('invoices')
      .select('amount')
      .eq('status', 'paid')
      .not('paid_date', 'is', null)
      .gte('paid_date', startDate)
      .lte('paid_date', endDate)
  ])

  const transactions = transactionsRes.data || []
  const paidInvoices = invoicesRes.data || []

  const transactionIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  const invoiceIncome = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return {
    income: transactionIncome + invoiceIncome,
    expenses,
    transactionIncome,
    invoiceIncome
  }
}
