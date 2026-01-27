import type { User } from '@supabase/supabase-js'

let cachedUser: User | null = null

export function setCachedUser(user: User | null) {
  cachedUser = user
}

export function getCachedUser() {
  return cachedUser
}

export function getCachedUserId() {
  return cachedUser?.id ?? null
}
