/**
 * Fonctions de récupération des données crypto
 *
 * Ces fonctions sont utilisées côté serveur (Server Components)
 * pour fetch les données depuis Supabase.
 */

import { createClient } from '@/lib/supabase/client'
import { CryptoMetric, ChartDataPoint } from '@/lib/supabase/types'

/**
 * Récupère les métriques crypto pour un symbole donné
 *
 * @param symbol - Le symbole (ex: "BTC-USD")
 * @param days - Nombre de jours d'historique (défaut: 30)
 */
export async function getCryptoMetrics(
  symbol: string = 'BTC-USD',
  days: number = 30
): Promise<CryptoMetric[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('crypto_metrics')
    .select('*')
    .eq('symbol', symbol)
    .order('date', { ascending: true })
    .limit(days + 1)  // +1 pour inclure la prédiction

  if (error) {
    console.error('Erreur Supabase:', error)
    throw new Error(`Impossible de récupérer les données: ${error.message}`)
  }

  return data || []
}

/**
 * Récupère les données formatées pour le graphique Recharts
 *
 * Transforme les données brutes en format attendu par le composant Chart.
 */
export async function getChartData(
  symbol: string = 'BTC-USD',
  days: number = 30
): Promise<ChartDataPoint[]> {
  const metrics = await getCryptoMetrics(symbol, days)

  return metrics.map((metric) => ({
    date: formatDate(metric.date),
    actual: metric.actual_price,
    predicted: metric.predicted_price,
  }))
}

/**
 * Récupère la dernière prédiction
 */
export async function getLatestPrediction(
  symbol: string = 'BTC-USD'
): Promise<CryptoMetric | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('crypto_metrics')
    .select('*')
    .eq('symbol', symbol)
    .not('predicted_price', 'is', null)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Erreur Supabase:', error)
    return null
  }

  return data as CryptoMetric
}

/**
 * Récupère le dernier prix réel connu
 */
export async function getLatestActualPrice(
  symbol: string = 'BTC-USD'
): Promise<CryptoMetric | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('crypto_metrics')
    .select('*')
    .eq('symbol', symbol)
    .not('actual_price', 'is', null)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Erreur Supabase:', error)
    return null
  }

  return data as CryptoMetric
}

// Helpers
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  })
}
