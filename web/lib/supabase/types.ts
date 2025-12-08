/**
 * Types générés pour Supabase
 *
 * Note: En production, utiliser `supabase gen types typescript`
 * pour générer automatiquement ces types depuis votre schéma.
 */

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          tags: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          tags?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          tags?: string[]
          is_active?: boolean
          updated_at?: string
        }
      }
      crypto_metrics: {
        Row: {
          id: string
          date: string
          symbol: string
          actual_price: number | null
          predicted_price: number | null
          model_version: string
          confidence_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          symbol?: string
          actual_price?: number | null
          predicted_price?: number | null
          model_version?: string
          confidence_score?: number | null
          created_at?: string
        }
        Update: {
          date?: string
          symbol?: string
          actual_price?: number | null
          predicted_price?: number | null
          model_version?: string
          confidence_score?: number | null
        }
      }
    }
  }
}

// Types utilitaires pour une utilisation plus simple
export type Project = Database['public']['Tables']['projects']['Row']
export type CryptoMetric = Database['public']['Tables']['crypto_metrics']['Row']

// Type pour les données du graphique
export interface ChartDataPoint {
  date: string
  actual: number | null
  predicted: number | null
}
