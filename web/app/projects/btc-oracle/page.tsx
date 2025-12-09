/**
 * Page BTC Oracle - Server Component
 *
 * Dashboard fintech premium avec:
 * - KPI Cards animées (Tremor + Framer Motion)
 * - Graphique interactif (Recharts)
 * - Métriques de performance
 * - Historique des prédictions
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
import { MetricCard } from './components/MetricCard'
import { PerformanceMetrics } from './components/PerformanceMetrics'
import { PredictionHistoryTable } from './components/PredictionHistoryTable'
import { Bitcoin, TrendingUp, Activity, Info } from 'lucide-react'

// Metadata pour le SEO
export const metadata: Metadata = {
  title: 'BTC Oracle | My-Tensor',
  description: 'Prédiction du cours Bitcoin à J+1 via Machine Learning',
}

// Rendu dynamique (pas de pre-rendering au build)
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
    <main className="min-h-screen bg-slate-950">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
              <Bitcoin className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-100">
                BTC Oracle
              </h1>
              <p className="text-slate-400 text-sm">
                Prédiction du cours Bitcoin à J+1 via régression linéaire
              </p>
            </div>
          </div>
        </header>

        {/* KPI Cards Grid */}
        <section className="grid gap-4 md:grid-cols-3 mb-8">
          <MetricCard
            title="Prix actuel"
            value={latestPrice?.actual_price}
            suffix="USD"
            date={latestPrice?.date}
            index={0}
          />
          <MetricCard
            title="Prédiction J+1"
            value={prediction?.predicted_price}
            suffix="USD"
            date={prediction?.date}
            highlight
            index={1}
          />
          <MetricCard
            title="Variation prédite"
            value={priceChange}
            suffix="%"
            trend={priceChange ? (priceChange > 0 ? 'up' : 'down') : undefined}
            index={2}
          />
        </section>

        {/* Graphique */}
        <section className="rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-100">
                Historique & Prédiction
              </h2>
            </div>
            {prediction?.confidence_score != null && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-400">
                  Confiance: {(prediction.confidence_score * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>

          <Suspense fallback={<ChartSkeleton />}>
            <BTCChart data={chartData} />
          </Suspense>

          {prediction?.prediction_lower_bound && prediction?.prediction_upper_bound && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Info className="w-3 h-3" />
              <span>
                Intervalle de confiance 95% : ${prediction.prediction_lower_bound.toLocaleString()} - ${prediction.prediction_upper_bound.toLocaleString()}
              </span>
            </div>
          )}
        </section>

        {/* Métriques de performance */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">
              Performance du modèle
            </h2>
          </div>
          <PerformanceMetrics metrics={performanceMetrics} />
        </section>

        {/* Historique des prédictions */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Historique des prédictions
          </h2>
          <PredictionHistoryTable history={predictionHistory} />
        </section>

        {/* Explications */}
        <section className="rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Comment ça marche ?
          </h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                1
              </div>
              <p className="text-sm text-slate-400">
                <strong className="text-slate-300">Collecte :</strong> Un script Python récupère les 30 derniers
                jours de données BTC-USD via Yahoo Finance.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                2
              </div>
              <p className="text-sm text-slate-400">
                <strong className="text-slate-300">Modèle :</strong> Une régression linéaire simple est entraînée
                sur l&apos;historique pour capturer la tendance.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                3
              </div>
              <p className="text-sm text-slate-400">
                <strong className="text-slate-300">Prédiction :</strong> Le modèle extrapole la tendance pour
                prédire le prix de demain.
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500 italic border-t border-slate-700/50 pt-4">
            Note : Ce modèle est volontairement simpliste à des fins pédagogiques.
            Les marchés financiers sont complexes et imprévisibles.
          </p>
        </section>
      </div>
    </main>
  )
}

// Skeleton pour le chargement du graphique
function ChartSkeleton() {
  return (
    <div className="h-[400px] w-full animate-pulse rounded-xl bg-slate-800/50" />
  )
}
