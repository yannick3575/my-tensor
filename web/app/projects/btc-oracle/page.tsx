/**
 * Page BTC Oracle - Server Component
 *
 * Cette page utilise les Server Components de Next.js 14:
 * - Les données sont fetchées côté serveur (pas de loading state client)
 * - Meilleur SEO car le HTML est pré-rendu
 * - Les secrets restent côté serveur
 *
 * Le composant Chart est un Client Component car Recharts
 * nécessite des APIs navigateur (canvas, events, etc.)
 */

import { Metadata } from 'next'
import { Suspense } from 'react'
import {
  getChartData,
  getLatestPrediction,
  getLatestActualPrice,
  getPredictionHistory,
  calculatePerformanceMetrics,
} from '@/lib/data/crypto'
import { BTCChart } from './components/BTCChart'
import { PredictionCard } from './components/PredictionCard'
import { PerformanceMetrics } from './components/PerformanceMetrics'
import { PredictionHistoryTable } from './components/PredictionHistoryTable'

// Metadata pour le SEO
export const metadata: Metadata = {
  title: 'BTC Oracle | My-Tensor',
  description: 'Prédiction du cours Bitcoin à J+1 via Machine Learning',
}

// Rendu dynamique (pas de pre-rendering au build)
// Le caching est géré par unstable_cache dans lib/data/crypto.ts
export const dynamic = 'force-dynamic'

export default async function BTCOraclePage() {
  // Fetch parallèle des données (Server-side)
  const [chartData, prediction, latestPrice, predictionHistory] = await Promise.all([
    getChartData('BTC-USD', 30),
    getLatestPrediction('BTC-USD'),
    getLatestActualPrice('BTC-USD'),
    getPredictionHistory('BTC-USD', 14),
  ])

  // Calcul de la variation prédite
  const priceChange = prediction && latestPrice?.actual_price
    ? ((prediction.predicted_price! - latestPrice.actual_price) / latestPrice.actual_price) * 100
    : null

  // Calcul des métriques de performance
  const performanceMetrics = calculatePerformanceMetrics(predictionHistory)

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🔮</span>
          <h1 className="text-3xl font-bold tracking-tight">BTC Oracle</h1>
        </div>
        <p className="text-muted-foreground">
          Prédiction du cours Bitcoin à J+1 via régression linéaire
        </p>
      </header>

      {/* Cartes de métriques */}
      <section className="grid gap-4 md:grid-cols-3 mb-8">
        <PredictionCard
          title="Prix actuel"
          value={latestPrice?.actual_price}
          suffix="USD"
          date={latestPrice?.date}
        />
        <PredictionCard
          title="Prédiction J+1"
          value={prediction?.predicted_price}
          suffix="USD"
          date={prediction?.date}
          highlight
        />
        <PredictionCard
          title="Variation prédite"
          value={priceChange}
          suffix="%"
          trend={priceChange ? (priceChange > 0 ? 'up' : 'down') : undefined}
        />
      </section>

      {/* Graphique */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Historique & Prédiction</h2>
        <Suspense fallback={<ChartSkeleton />}>
          <BTCChart data={chartData} />
        </Suspense>
        {prediction?.prediction_lower_bound && prediction?.prediction_upper_bound && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Intervalle de confiance 95% : ${prediction.prediction_lower_bound.toLocaleString()} - ${prediction.prediction_upper_bound.toLocaleString()}
          </p>
        )}
      </section>

      {/* Métriques de performance */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Performance du modèle</h2>
        <PerformanceMetrics metrics={performanceMetrics} />
      </section>

      {/* Historique des prédictions */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Historique des prédictions</h2>
        <PredictionHistoryTable history={predictionHistory} />
      </section>

      {/* Explications */}
      <section className="mt-8 rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Comment ça marche ?</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ol className="space-y-2 text-muted-foreground">
            <li>
              <strong>Collecte :</strong> Un script Python récupère les 30 derniers
              jours de données BTC-USD via Yahoo Finance.
            </li>
            <li>
              <strong>Modèle :</strong> Une régression linéaire simple est entraînée
              sur l&apos;historique pour capturer la tendance.
            </li>
            <li>
              <strong>Prédiction :</strong> Le modèle extrapole la tendance pour
              prédire le prix de demain.
            </li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground/80 italic">
            Note : Ce modèle est volontairement simpliste à des fins pédagogiques.
            Les marchés financiers sont complexes et imprévisibles.
          </p>
        </div>
      </section>

      {/* Footer avec confiance */}
      {prediction?.confidence_score != null && (
        <footer className="mt-4 text-center text-sm text-muted-foreground">
          Score de confiance du modèle : {(prediction.confidence_score * 100).toFixed(1)}%
        </footer>
      )}
    </main>
  )
}

// Skeleton pour le chargement du graphique
function ChartSkeleton() {
  return (
    <div className="h-[400px] w-full animate-pulse rounded bg-muted" />
  )
}
