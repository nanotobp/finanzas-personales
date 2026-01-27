import type { QueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getMonthEndDate } from '@/lib/utils'
import { fetchExpenseMeta, fetchExpenses } from '@/lib/services/expenses-service'
import { getDashboardStats } from '@/lib/services/dashboard-service'

type PrefetchContext = {
  route: string
  queryClient: QueryClient
  supabase: SupabaseClient
  userId: string | null
}

const prefetchIfEmpty = async <T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
) => {
  if (queryClient.getQueryData(queryKey) !== undefined) return
  await queryClient.prefetchQuery({ queryKey, queryFn })
}

const fetchAccounts = async (supabase: SupabaseClient, userId: string | null) => {
  if (!userId) return []
  const { data } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('name')
  return data || []
}

const fetchCards = async (supabase: SupabaseClient, userId: string | null) => {
  if (!userId) return []
  const { data } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .order('name')

  const currentMonth = new Date().toISOString().slice(0, 7)
  const startDate = `${currentMonth}-01`
  const endDate = getMonthEndDate(currentMonth)

  const cardsWithDebt = await Promise.all(
    (data || []).map(async (card: any) => {
      const { data: expenses } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .eq('card_id', card.id)
        .gte('date', startDate)
        .lte('date', endDate)

      const currentDebt = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
      const usagePercentage = card.limit ? (currentDebt / Number(card.limit)) * 100 : 0

      return {
        ...card,
        currentDebt,
        usagePercentage: Math.min(usagePercentage, 100),
        available: card.limit ? Number(card.limit) - currentDebt : 0,
      }
    })
  )

  return cardsWithDebt
}

const fetchIncomePaidInvoices = async (supabase: SupabaseClient, userId: string | null, month: string) => {
  if (!userId) return []
  const startDate = `${month}-01`
  const endDate = getMonthEndDate(month)
  const { data } = await supabase
    .from('invoices')
    .select('*, client:clients(id, name)')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .not('paid_date', 'is', null)
    .gte('paid_date', startDate)
    .lte('paid_date', endDate)
    .order('paid_date', { ascending: false })

  return data || []
}

const fetchIncomeOther = async (supabase: SupabaseClient, userId: string | null, month: string) => {
  if (!userId) return []
  const startDate = `${month}-01`
  const endDate = getMonthEndDate(month)
  const { data } = await supabase
    .from('transactions')
    .select('*, categories(name, icon, color), clients(name)')
    .eq('user_id', userId)
    .eq('type', 'income')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  return data || []
}

const fetchBudgetsList = async (supabase: SupabaseClient, userId: string | null, month: string) => {
  if (!userId) return []
  const startDate = `${month}-01`
  const endDate = getMonthEndDate(month)

  const { data: budgets } = await supabase
    .from('budgets')
    .select('*, categories(name, icon, color)')
    .eq('user_id', userId)
    .eq('month', month)
    .or(`end_date.is.null,end_date.gte.${month}`)
    .order('amount', { ascending: false })

  const budgetsWithSpent = await Promise.all(
    (budgets || []).map(async (budget: any) => {
      let expensesQuery = supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .eq('category_id', budget.category_id)
        .gte('date', startDate)
        .lte('date', endDate)

      if (budget.project_id) {
        expensesQuery = expensesQuery.eq('project_id', budget.project_id)
      }

      const { data: expenses } = await expensesQuery

      const spent = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
      const total = Number(budget.amount)
      const percentage = total > 0 ? (spent / total) * 100 : 0

      return {
        ...budget,
        spent,
        percentage: Math.min(percentage, 100),
        remaining: total - spent,
      }
    })
  )

  return budgetsWithSpent
}

const fetchBudgetsSummary = async (supabase: SupabaseClient, userId: string | null, month: string) => {
  if (!userId) {
    return { totalBudget: 0, totalBudgets: 0, overBudget: 0, onTrack: 0 }
  }
  const startDate = `${month}-01`
  const endDate = getMonthEndDate(month)

  const { data: budgets } = await supabase
    .from('budgets')
    .select('*, categories(id)')
    .eq('user_id', userId)
    .eq('month', month)
    .or(`end_date.is.null,end_date.gte.${month}`)

  const { data: expenses } = await supabase
    .from('transactions')
    .select('amount, category_id, project_id')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', startDate)
    .lte('date', endDate)
    .not('category_id', 'is', null)

  const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.amount), 0) || 0

  let overBudget = 0
  let onTrack = 0

  budgets?.forEach((budget: any) => {
    const spent = (expenses || [])
      .filter((t: any) => t.category_id === budget.category_id)
      .filter((t: any) => {
        if (budget.project_id) return t.project_id === budget.project_id
        return true
      })
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

    const total = Number(budget.amount)
    const percentage = total > 0 ? (spent / total) * 100 : 0
    if (percentage >= 100) overBudget++
    else if (percentage < 80) onTrack++
  })

  return {
    totalBudget,
    totalBudgets: budgets?.length || 0,
    overBudget,
    onTrack,
  }
}

const fetchSubscriptionsList = async (supabase: SupabaseClient, userId: string | null) => {
  if (!userId) return []
  const { data } = await supabase
    .from('subscriptions')
    .select('*, categories(name, icon)')
    .eq('user_id', userId)
    .order('next_billing_date', { ascending: true })

  return data || []
}

const fetchSubscriptionsMobile = async (supabase: SupabaseClient, userId: string | null) => {
  if (!userId) return []
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('next_billing_date', { ascending: true })

  return data || []
}

const fetchClients = async (supabase: SupabaseClient, userId: string | null) => {
  if (!userId) return []
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('name')

  return data || []
}

const fetchProjects = async (supabase: SupabaseClient, userId: string | null, month: string) => {
  if (!userId) return []
  const startDate = `${month}-01`
  const endDate = getMonthEndDate(month)

  const { data: projectsData } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('name')

  const projectsWithStats = await Promise.all(
    (projectsData || []).map(async (project: any) => {
      const { data: income } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'income')
        .eq('project_id', project.id)
        .gte('date', startDate)
        .lte('date', endDate)

      const { data: expenses } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .eq('project_id', project.id)
        .gte('date', startDate)
        .lte('date', endDate)

      const totalIncome = income?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
      const profit = totalIncome - totalExpenses

      return {
        ...project,
        totalIncome,
        totalExpenses,
        profit,
      }
    })
  )

  return projectsWithStats
}

const fetchGoals = async (supabase: SupabaseClient, userId: string | null) => {
  if (!userId) return []
  const { data } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return data || []
}

const fetchGoalsMobile = async (supabase: SupabaseClient, userId: string | null) => {
  const data = await fetchGoals(supabase, userId)
  return data.map((goal: any) => ({
    ...goal,
    progress_percentage: Number(goal.current_amount) / Number(goal.target_amount) * 100
  }))
}

const fetchInvoices = async (supabase: SupabaseClient, userId: string | null) => {
  if (!userId) return []
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      client:clients(name),
      category:categories(name, icon)
    `)
    .eq('user_id', userId)
    .order('due_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function prefetchRouteData({ route, queryClient, supabase, userId }: PrefetchContext) {
  const currentMonth = new Date().toISOString().slice(0, 7)

  if (!userId && route !== '/dashboard') return

  if (route === '/dashboard') {
    await prefetchIfEmpty(queryClient, ['dashboard-stats', currentMonth], () => getDashboardStats(currentMonth))
    return
  }

  if (route === '/expenses') {
    await Promise.all([
      prefetchIfEmpty(queryClient, ['expenses-meta'], () => fetchExpenseMeta(userId as string)),
      prefetchIfEmpty(queryClient, ['expenses', currentMonth, 'all'], () =>
        fetchExpenses({ month: currentMonth, userId: userId as string })
      ),
    ])
    return
  }

  if (route === '/income') {
    await Promise.all([
      prefetchIfEmpty(queryClient, ['paid-invoices', currentMonth], () => fetchIncomePaidInvoices(supabase, userId, currentMonth)),
      prefetchIfEmpty(queryClient, ['other-income', currentMonth], () => fetchIncomeOther(supabase, userId, currentMonth)),
    ])
    return
  }

  if (route === '/accounts') {
    await prefetchIfEmpty(queryClient, ['accounts'], () => fetchAccounts(supabase, userId))
    return
  }

  if (route === '/cards') {
    await prefetchIfEmpty(queryClient, ['cards'], () => fetchCards(supabase, userId))
    return
  }

  if (route === '/budgets') {
    await Promise.all([
      prefetchIfEmpty(queryClient, ['budgets', currentMonth], () => fetchBudgetsList(supabase, userId, currentMonth)),
      prefetchIfEmpty(queryClient, ['budgets-summary', currentMonth], () => fetchBudgetsSummary(supabase, userId, currentMonth)),
    ])
    return
  }

  if (route === '/subscriptions') {
    await Promise.all([
      prefetchIfEmpty(queryClient, ['subscriptions', userId], () => fetchSubscriptionsList(supabase, userId)),
      prefetchIfEmpty(queryClient, ['subscriptions-mobile', userId], () => fetchSubscriptionsMobile(supabase, userId)),
    ])
    return
  }

  if (route === '/clients') {
    await prefetchIfEmpty(queryClient, ['clients'], () => fetchClients(supabase, userId))
    return
  }

  if (route === '/projects') {
    await prefetchIfEmpty(queryClient, ['projects', currentMonth], () => fetchProjects(supabase, userId, currentMonth))
    return
  }

  if (route === '/goals') {
    await Promise.all([
      prefetchIfEmpty(queryClient, ['savings-goals'], () => fetchGoals(supabase, userId)),
      prefetchIfEmpty(queryClient, ['goals-mobile', userId], () => fetchGoalsMobile(supabase, userId)),
    ])
    return
  }

  if (route === '/invoices' || route.startsWith('/invoices/')) {
    await prefetchIfEmpty(queryClient, ['invoices'], () => fetchInvoices(supabase, userId))
  }
}
