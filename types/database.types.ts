export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'expense' | 'income'
          color: string
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'expense' | 'income'
          color?: string
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'expense' | 'income'
          color?: string
          icon?: string | null
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'cash' | 'checking' | 'savings' | 'investment'
          balance: number
          currency: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'cash' | 'checking' | 'savings' | 'investment'
          balance?: number
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'cash' | 'checking' | 'savings' | 'investment'
          balance?: number
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'expense' | 'income' | 'transfer'
          amount: number
          description: string
          date: string
          category_id: string | null
          account_id: string | null
          card_id: string | null
          project_id: string | null
          client_id: string | null
          status: 'pending' | 'confirmed' | 'reconciled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'expense' | 'income' | 'transfer'
          amount: number
          description: string
          date: string
          category_id?: string | null
          account_id?: string | null
          card_id?: string | null
          project_id?: string | null
          client_id?: string | null
          status?: 'pending' | 'confirmed' | 'reconciled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'expense' | 'income' | 'transfer'
          amount?: number
          description?: string
          date?: string
          category_id?: string | null
          account_id?: string | null
          card_id?: string | null
          project_id?: string | null
          client_id?: string | null
          status?: 'pending' | 'confirmed' | 'reconciled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cards: {
        Row: {
          id: string
          user_id: string
          name: string
          last_four: string
          brand: string
          limit: number | null
          close_day: number
          due_day: number
          currency: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          last_four: string
          brand: string
          limit?: number | null
          close_day: number
          due_day: number
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          last_four?: string
          brand?: string
          limit?: number | null
          close_day?: number
          due_day?: number
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          month: string
          end_date: string | null
          project_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          amount: number
          month: string
          end_date?: string | null
          project_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          amount?: number
          month?: string
          end_date?: string | null
          project_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          category_id: string
          billing_cycle: 'daily' | 'weekly' | 'monthly' | 'yearly'
          next_billing_date: string
          payment_method_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: number
          category_id: string
          billing_cycle: 'daily' | 'weekly' | 'monthly' | 'yearly'
          next_billing_date: string
          payment_method_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number
          category_id?: string
          billing_cycle?: 'daily' | 'weekly' | 'monthly' | 'yearly'
          next_billing_date?: string
          payment_method_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'fixed' | 'occasional'
          monthly_amount: number | null
          email: string | null
          phone: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'fixed' | 'occasional'
          monthly_amount?: number | null
          email?: string | null
          phone?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'fixed' | 'occasional'
          monthly_amount?: number | null
          email?: string | null
          phone?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          color: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          user_id: string
          transaction_id: string
          file_name: string
          file_url: string
          file_size: number
          mime_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_id: string
          file_name: string
          file_url: string
          file_size: number
          mime_type: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_id?: string
          file_name?: string
          file_url?: string
          file_size?: number
          mime_type?: string
          created_at?: string
        }
      }
    }
  }
}
