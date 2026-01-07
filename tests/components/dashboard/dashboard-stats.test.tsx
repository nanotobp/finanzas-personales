import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/tests/utils/test-utils'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      gte: vi.fn(() => ({
        lte: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [
              { amount: 1000, type: 'income' },
              { amount: 1500, type: 'income' },
              { amount: 800, type: 'expense' }
            ],
            error: null
          }))
        }))
      }))
    }))
  }))
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

// Mock formatCurrency function
vi.mock('@/lib/utils', () => ({
  formatCurrency: vi.fn((amount) => `$${amount?.toLocaleString() || '0'}`),
  cn: vi.fn((...args) => args.filter(Boolean).join(' '))
}))

describe('DashboardStats Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<DashboardStats stats={{ income: 1000, expenses: 500, balance: 500, net: 500, balanceChange: 0, incomeChange: 0, expensesChange: 0, netChange: 0 }} />)
    expect(document.body).toBeInTheDocument()
  })

  it('displays component structure', () => {
    const { container } = render(<DashboardStats stats={{ income: 1000, expenses: 500, balance: 500, net: 500, balanceChange: 0, incomeChange: 0, expensesChange: 0, netChange: 0 }} />)
    // The component should render without errors
    expect(container.firstChild).toBeTruthy()
  })
})