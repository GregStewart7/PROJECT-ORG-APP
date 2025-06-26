import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Create a single supabase client for interacting with your database
export function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      }
    }
  )
}

// For client-side usage with SSR support
export function createClientComponentClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Use browser client for better session persistence in client components
export const supabase = typeof window !== 'undefined' 
  ? createClientComponentClient() 
  : createSupabaseClient() 