/**
 * PredictionCard - Carte d'affichage de métrique
 *
 * Server Component simple pour afficher une valeur avec son label.
 * Utilise les utilitaires Tailwind pour le style.
 */

import { cn } from '@/lib/utils'

interface PredictionCardProps {
  title: string
  value: number | null | undefined
  suffix?: string
  date?: string | null
  highlight?: boolean
  trend?: 'up' | 'down'
}

export function PredictionCard({
  title,
  value,
  suffix = '',
  date,
  highlight = false,
  trend,
}: PredictionCardProps) {
  // Formatter la valeur selon le type
  const formatValue = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return '—'

    if (suffix === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val)
    }

    if (suffix === '%') {
      const sign = val > 0 ? '+' : ''
      return `${sign}${val.toFixed(2)}%`
    }

    return val.toLocaleString()
  }

  // Déterminer la couleur de la tendance
  const trendColor = trend === 'up'
    ? 'text-green-500'
    : trend === 'down'
      ? 'text-red-500'
      : ''

  // Icône de tendance
  const TrendIcon = () => {
    if (!trend) return null
    return trend === 'up' ? (
      <svg
        className="w-5 h-5 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 17l9.2-9.2M17 17V7H7"
        />
      </svg>
    ) : (
      <svg
        className="w-5 h-5 text-red-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 7l-9.2 9.2M7 7v10h10"
        />
      </svg>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 transition-colors',
        highlight && 'border-primary bg-primary/5'
      )}
    >
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <div className="flex items-center gap-2">
        <p className={cn('text-2xl font-bold', trendColor)}>
          {formatValue(value)}
        </p>
        <TrendIcon />
      </div>
      {date && (
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      )}
    </div>
  )
}
