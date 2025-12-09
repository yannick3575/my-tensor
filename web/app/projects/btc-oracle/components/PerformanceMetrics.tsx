/**
 * PerformanceMetrics - Affiche les métriques de performance du modèle
 *
 * Cartes affichant MAE, RMSE, Accuracy et nombre de prédictions.
 */

import { PerformanceMetrics as Metrics } from '@/lib/supabase/types'

interface PerformanceMetricsProps {
  metrics: Metrics
}

export function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  const cards = [
    {
      title: 'MAE',
      description: 'Erreur absolue moyenne',
      value: metrics.mae,
      format: (v: number) => `$${v.toLocaleString('en-US')}`,
    },
    {
      title: 'RMSE',
      description: 'Racine de l\'erreur quadratique',
      value: metrics.rmse,
      format: (v: number) => `$${v.toLocaleString('en-US')}`,
    },
    {
      title: 'Précision',
      description: 'Prédictions < 5% d\'erreur',
      value: metrics.accuracy,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      title: 'Prédictions',
      description: 'Total analysées',
      value: metrics.totalPredictions,
      format: (v: number) => v.toString(),
    },
  ]

  if (metrics.totalPredictions === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        <p>Pas encore assez de données pour calculer les métriques de performance.</p>
        <p className="text-sm mt-2">Les métriques apparaîtront après plusieurs jours de prédictions.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-lg border bg-card p-4 transition-colors hover:border-accent/50"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {card.title}
          </p>
          <p className="text-2xl font-bold mt-1">
            {card.format(card.value)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {card.description}
          </p>
        </div>
      ))}
    </div>
  )
}
