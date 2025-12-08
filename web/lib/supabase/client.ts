/**
 * Client Supabase pour Next.js
 *
 * Deux clients distincts:
 * - createClient(): Pour les Server Components (accès direct, pas de cache)
 * - createBrowserClient(): Pour les Client Components (si nécessaire)
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

// Variables d'environnement (côté serveur)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Client pour Server Components
 * Utilisé dans les pages et composants serveur pour fetch les données
 */
export function createClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,  // Pas de session côté serveur
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

  browserClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
  return browserClient
}
