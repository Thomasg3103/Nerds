import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Pass placeholders when env vars are missing so the app renders instead of
// crashing on module load. Auth calls will fail gracefully and land on /login.
export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  key ?? 'placeholder-anon-key'
)

export const isSupabaseConfigured = Boolean(url && key)
