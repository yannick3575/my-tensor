/**
 * Client Supabase pour Next.js 14+ App Router
 *
 * Utilise @supabase/ssr pour une intégration optimale:
 * - createClient(): Pour les Server Components (async, avec cookies)
 * - createBrowserClient(): Pour les Client Components
 */

import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
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
 * Client pour Server Components (App Router)
 *
 * Utilise @supabase/ssr avec gestion des cookies.
 * Note: Cette fonction est async car cookies() est async dans Next.js 15+
 */
export async function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getEnvVars()
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // setAll est appelé depuis un Server Component
          // où les cookies ne peuvent pas être modifiés.
          // Ignoré car on est en lecture seule.
        }
      },
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
