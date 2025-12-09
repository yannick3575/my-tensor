/**
 * PredictionHistoryTable - Tableau comparant prédictions vs prix réels
 *
 * Affiche l'historique avec code couleur selon la précision.
 */

import { PredictionComparison } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface PredictionHistoryTableProps {
  history: PredictionComparison[]
}

// Formatage des prix en USD
function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Formatage des dates
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Détermine la couleur selon le pourcentage d'erreur
function getAccuracyStatus(errorPercent: number): {
  color: string
  bgColor: string
  icon: string
  label: string
} {
  const absError = Math.abs(errorPercent)

  if (absError < 5) {
    return {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      icon: '✓',
      label: 'Précis',
    }
  } else if (absError < 10) {
    return {
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      icon: '~',
      label: 'Acceptable',
    }
  } else {
    return {
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      icon: '✗',
      label: 'Imprécis',
    }
  }
}

export function PredictionHistoryTable({ history }: PredictionHistoryTableProps) {
  if (history.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        <p>Pas encore d&apos;historique de prédictions à afficher.</p>
        <p className="text-sm mt-2">
          L&apos;historique apparaîtra lorsque des prédictions auront été vérifiées.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-right p-3 font-medium">Prédit</th>
              <th className="text-right p-3 font-medium">Réel</th>
              <th className="text-right p-3 font-medium">Erreur</th>
              <th className="text-center p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => {
              const status = getAccuracyStatus(item.errorPercent)

              return (
                <tr
                  key={item.date}
                  className={cn(
                    'border-b last:border-0 transition-colors hover:bg-muted/30',
                    index % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'
                  )}
                >
                  <td className="p-3 text-muted-foreground">
                    {formatDate(item.date)}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatUSD(item.predicted)}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatUSD(item.actual)}
                  </td>
                  <td className={cn('p-3 text-right font-mono', status.color)}>
                    {item.errorPercent > 0 ? '+' : ''}
                    {item.errorPercent.toFixed(2)}%
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                        status.bgColor,
                        status.color
                      )}
                    >
                      <span>{status.icon}</span>
                      <span className="hidden sm:inline">{status.label}</span>
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
