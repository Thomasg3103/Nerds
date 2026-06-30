import { supabase } from './supabase'

const BASE = 'http://localhost:3001'

// Wraps fetch with the current session's JWT so every request is authenticated.
export async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    ...options.headers,
  }
  return fetch(`${BASE}${path}`, { ...options, headers })
}
