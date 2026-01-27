import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let client: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (client) return client

  const url = import.meta.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Faltan variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  client = createSupabaseClient(url, anonKey)

  return client
}
