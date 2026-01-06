import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@/tests/utils/test-utils'
import { IncomeExpensesChart } from '@/components/dashboard/income-expenses-chart'

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Bar: vi.fn(() => <div data-testid="bar-chart">Mocked Chart</div>)
}))

vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn()
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  BarElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn()
}))

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      gte: vi.fn(() => ({
        lte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              {
                amount: 1000,
                date: '2024-01-15',
                type: 'income'
              },
              {
                amount: 500,
                date: '2024-01-20',
                type: 'expense'
              }
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

describe('IncomeExpensesChart Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<IncomeExpensesChart />)
    expect(document.body).toBeInTheDocument()
  })

  it('component structure is present', () => {
    const { container } = render(<IncomeExpensesChart />)
    expect(container.firstChild).toBeTruthy()
  })
})