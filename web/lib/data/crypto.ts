/**
 * Fonctions de récupération des données crypto
 *
 * Ces fonctions sont utilisées côté serveur (Server Components)
 * pour fetch les données depuis Supabase.
 *
 * Utilise unstable_cache pour le caching natif Next.js.
 */

import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/client'
import { CryptoMetric, ChartDataPoint, PredictionComparison, PerformanceMetrics } from '@/lib/supabase/types'

/**
 * Récupère les métriques crypto pour un symbole donné
 *
 * @param symbol - Le symbole (ex: "BTC-USD")
 * @param days - Nombre de jours d'historique (défaut: 30)
 */
export const getCryptoMetrics = unstable_cache(
  async (symbol: string = 'BTC-USD', days: number = 30): Promise<CryptoMetric[]> => {
    const supabase = await createClient()

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
  },
  ['crypto-metrics'],
  { revalidate: 3600, tags: ['crypto'] }
)

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
    lowerBound: metric.prediction_lower_bound,
    upperBound: metric.prediction_upper_bound,
  }))
}

/**
 * Récupère la dernière prédiction
 */
export const getLatestPrediction = unstable_cache(
  async (symbol: string = 'BTC-USD'): Promise<CryptoMetric | null> => {
    const supabase = await createClient()

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
  },
  ['latest-prediction'],
  { revalidate: 3600, tags: ['crypto'] }
)

/**
 * Récupère le dernier prix réel connu
 */
export const getLatestActualPrice = unstable_cache(
  async (symbol: string = 'BTC-USD'): Promise<CryptoMetric | null> => {
    const supabase = await createClient()

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
  },
  ['latest-actual-price'],
  { revalidate: 3600, tags: ['crypto'] }
)

/**
 * Récupère l'historique des prédictions avec comparaison aux prix réels
 *
 * Ne retourne que les lignes où on a à la fois une prédiction ET un prix réel
 */
export const getPredictionHistory = unstable_cache(
  async (symbol: string = 'BTC-USD', limit: number = 14): Promise<PredictionComparison[]> => {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('crypto_metrics')
      .select('*')
      .eq('symbol', symbol)
      .not('predicted_price', 'is', null)
      .not('actual_price', 'is', null)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Erreur Supabase:', error)
      return []
    }

    if (!data) return []

    return data.map((metric: CryptoMetric) => {
      const predicted = metric.predicted_price!
      const actual = metric.actual_price!
      const predictionError = actual - predicted
      const errorPercent = (predictionError / actual) * 100

      return {
        date: metric.date,
        predicted,
        actual,
        error: predictionError,
        errorPercent,
        confidence: metric.confidence_score,
      }
    })
  },
  ['prediction-history'],
  { revalidate: 3600, tags: ['crypto'] }
)

/**
 * Calcule les métriques de performance à partir de l'historique des prédictions
 */
export function calculatePerformanceMetrics(
  history: PredictionComparison[]
): PerformanceMetrics {
  if (history.length === 0) {
    return { mae: 0, rmse: 0, accuracy: 0, totalPredictions: 0 }
  }

  const errors = history.map((h) => Math.abs(h.error))
  const squaredErrors = history.map((h) => h.error * h.error)
  const accurateCount = history.filter((h) => Math.abs(h.errorPercent) < 5).length

  const mae = errors.reduce((sum, e) => sum + e, 0) / errors.length
  const rmse = Math.sqrt(squaredErrors.reduce((sum, e) => sum + e, 0) / squaredErrors.length)
  const accuracy = (accurateCount / history.length) * 100

  return {
    mae: Math.round(mae * 100) / 100,
    rmse: Math.round(rmse * 100) / 100,
    accuracy: Math.round(accuracy * 10) / 10,
    totalPredictions: history.length,
  }
}

// Helpers
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  })
}
