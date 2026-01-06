import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/tests/utils/test-utils'
import { SavingGoals } from '@/components/dashboard/saving-goals'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: [
              {
                id: 1,
                name: 'Viaje a Europa',
                target_amount: 5000,
                current_amount: 2500,
                created_at: '2024-01-01',
                target_date: '2024-12-31'
              },
              {
                id: 2,
                name: 'Fondo de emergencia',
                target_amount: 10000,
                current_amount: 7500,
                created_at: '2024-01-01',
                target_date: '2024-06-30'
              }
            ],
            error: null
          }))
        }))
      }))
    }))
  }))
}))

describe('SavingGoals Component', () => {
  it('renders loading skeleton initially', () => {
    render(<SavingGoals />)
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('displays saving goals when data is loaded', async () => {
    render(<SavingGoals />)
    
    await waitFor(() => {
      expect(screen.getByText('Viaje a Europa')).toBeInTheDocument()
      expect(screen.getByText('Fondo de emergencia')).toBeInTheDocument()
    })

    // Check progress percentages
    expect(screen.getByText('50%')).toBeInTheDocument() // 2500/5000
    expect(screen.getByText('75%')).toBeInTheDocument() // 7500/10000
  })

  it('displays "Ver todos" button', async () => {
    render(<SavingGoals />)
    
    await waitFor(() => {
      const viewAllButton = screen.getByRole('button', { name: /ver todos/i })
      expect(viewAllButton).toBeInTheDocument()
    })
  })

  it('displays empty state when no goals exist', async () => {
    // Override mock for empty data
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: [],
              error: null
            }))
          }))
        }))
      }))
    }
    
    const { createClient } = await import('@/lib/supabase/client')
    vi.mocked(createClient).mockReturnValueOnce(mockClient)

    render(<SavingGoals />)
    
    await waitFor(() => {
      expect(screen.getByText(/no hay objetivos registrados/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /crear objetivo/i })).toBeInTheDocument()
    })
  })
})