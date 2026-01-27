import { createClient } from '@/lib/supabase/client'

function assertUserId(userId?: string | null) {
  if (!userId) {
    throw new Error('No autorizado')
  }
}

export async function fetchExpenseMeta(userId: string) {
  assertUserId(userId)
  const supabase = createClient()

  const [categoriesRes, accountsRes, projectsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .order('name'),
    supabase.from('accounts').select('*').eq('user_id', userId).order('name'),
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name'),
  ])

  if (categoriesRes.error || accountsRes.error || projectsRes.error) {
    throw new Error(
      categoriesRes.error?.message ||
        accountsRes.error?.message ||
        projectsRes.error?.message ||
        'Error cargando datos'
    )
  }

  return {
    categories: categoriesRes.data ?? [],
    accounts: accountsRes.data ?? [],
    projects: projectsRes.data ?? [],
  }
}

export async function fetchExpenses(params: { month: string; categoryId?: string; userId: string }) {
  const { month, categoryId, userId } = params
  assertUserId(userId)
  const supabase = createClient()

  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const monthNum = Number(monthStr)

  if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
    throw new Error('Mes inválido')
  }

  const startDate = `${month}-01`
  const endDate = new Date(year, monthNum, 0).toISOString().slice(0, 10)

  let query = supabase
    .from('transactions')
    .select('*, categories(name, icon, color), accounts(name)')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  if (categoryId && categoryId !== 'all') {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function createExpense(input: {
  userId: string
  amount: number
  description: string
  category_id: string
  account_id: string
  date: string
  project_id?: string | null
  notes?: string | null
}) {
  assertUserId(input.userId)
  const supabase = createClient()

  const payload = {
    user_id: input.userId,
    type: 'expense' as const,
    amount: Number(input.amount),
    description: String(input.description ?? ''),
    category_id: String(input.category_id ?? ''),
    account_id: String(input.account_id ?? ''),
    date: String(input.date ?? ''),
    project_id: input.project_id ? String(input.project_id) : null,
    notes: input.notes ? String(input.notes) : null,
    status: 'confirmed' as const,
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
    .select('*, categories(name, icon, color), accounts(name)')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateExpense(
  id: string,
  input: {
    userId: string
    amount?: number
    description?: string
    category_id?: string
    account_id?: string
    date?: string
    project_id?: string | null
    notes?: string | null
  }
) {
  assertUserId(input.userId)
  const supabase = createClient()

  const updates = {
    amount: input.amount != null ? Number(input.amount) : undefined,
    description: input.description != null ? String(input.description) : undefined,
    category_id: input.category_id != null ? String(input.category_id) : undefined,
    account_id: input.account_id != null ? String(input.account_id) : undefined,
    date: input.date != null ? String(input.date) : undefined,
    project_id: input.project_id ? String(input.project_id) : null,
    notes: input.notes ? String(input.notes) : null,
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', input.userId)
    .select('*, categories(name, icon, color), accounts(name)')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function deleteExpense(id: string, userId: string) {
  assertUserId(userId)
  const supabase = createClient()

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}
