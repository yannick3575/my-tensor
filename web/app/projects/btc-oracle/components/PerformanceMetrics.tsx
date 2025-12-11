'use client'

/**
 * PerformanceMetrics - Métriques de performance premium
 *
 * Affiche MAE, RMSE, Accuracy et nombre de prédictions
 * avec animations Framer Motion et style glassmorphism.
 */

import { motion } from 'framer-motion'
import { PerformanceMetrics as Metrics } from '@/lib/supabase/types'
import { Target, TrendingDown, CheckCircle, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      icon: Target,
      color: 'blue',
    },
    {
      title: 'RMSE',
      description: 'Racine erreur quadratique',
      value: metrics.rmse,
      format: (v: number) => `$${v.toLocaleString('en-US')}`,
      icon: TrendingDown,
      color: 'purple',
    },
    {
      title: 'Précision',
      description: 'Prédictions < 5% erreur',
      value: metrics.accuracy,
      format: (v: number) => `${v.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'emerald',
      highlight: metrics.accuracy >= 50,
    },
    {
      title: 'Prédictions',
      description: 'Total analysées',
      value: metrics.totalPredictions,
      format: (v: number) => v.toString(),
      icon: BarChart3,
      color: 'cyan',
    },
  ]

  const colorClasses: Record<string, { icon: string; border: string; bg: string }> = {
    blue: {
      icon: 'text-blue-400',
      border: 'hover:border-blue-500/30',
      bg: 'bg-blue-500/10',
    },
    purple: {
      icon: 'text-purple-400',
      border: 'hover:border-purple-500/30',
      bg: 'bg-purple-500/10',
    },
    emerald: {
      icon: 'text-emerald-400',
      border: 'hover:border-emerald-500/30',
      bg: 'bg-emerald-500/10',
    },
    cyan: {
      icon: 'text-cyan-400',
      border: 'hover:border-cyan-500/30',
      bg: 'bg-cyan-500/10',
    },
  }

  if (metrics.totalPredictions === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl p-6 text-center"
      >
        <p className="text-slate-400">Pas encore assez de données pour calculer les métriques de performance.</p>
        <p className="text-sm text-slate-500 mt-2">Les métriques apparaîtront après plusieurs jours de prédictions.</p>
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const colors = colorClasses[card.color]
        const Icon = card.icon

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: index * 0.1,
              ease: 'easeOut',
            }}
            whileHover={{ scale: 1.02 }}
            className={cn(
              'relative overflow-hidden rounded-xl',
              'bg-slate-900/50 backdrop-blur-xl',
              'border border-slate-700/50',
              'p-4 transition-all duration-300',
              colors.border,
              card.highlight && 'ring-1 ring-emerald-500/30'
            )}
          >
            {/* Icon badge */}
            <div className={cn('inline-flex p-2 rounded-lg mb-3', colors.bg)}>
              <Icon className={cn('w-4 h-4', colors.icon)} />
            </div>

            {/* Title */}
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
              {card.title}
            </p>

            {/* Value */}
            <p className={cn(
              'text-2xl font-bold mt-1 text-slate-100',
              card.highlight && 'text-emerald-400'
            )}>
              {card.format(card.value)}
            </p>

            {/* Description */}
            <p className="text-xs text-slate-500 mt-1">
              {card.description}
            </p>

            {/* Subtle glow for highlight */}
            {card.highlight && (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
