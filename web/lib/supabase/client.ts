/**
 * Client Supabase pour Next.js 14+ App Router
 *
 * Deux clients distincts:
 * - createClient(): Pour les Server Components (sans cookies pour compatibilité cache)
 * - createBrowserClient(): Pour les Client Components
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

// Validation des variables d'environnement
function getEnvVars() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    )
  }

  return { supabaseUrl, supabaseAnonKey }
}

/**
 * Client pour Server Components
 *
 * Note: Ce client n'utilise pas de cookies pour être compatible avec unstable_cache.
 * Pour les opérations authentifiées, utilisez createAuthClient() à la place.
 */
export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getEnvVars()

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })
}

/**
 * Client singleton pour le navigateur (Client Components)
 * Réutilise la même instance pour éviter les connexions multiples
 */
let browserClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createBrowserClient() {
  if (browserClient) return browserClient

  const { supabaseUrl, supabaseAnonKey } = getEnvVars()
  browserClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
  return browserClient
}
