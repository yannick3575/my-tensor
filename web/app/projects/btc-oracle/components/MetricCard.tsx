'use client'

/**
 * MetricCard - Carte KPI premium avec animations
 *
 * Client Component utilisant:
 * - Tremor pour les composants KPI (Card, BadgeDelta)
 * - Framer Motion pour les animations d'entrée et hover
 * - react-countup pour les compteurs animés
 */

import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { Card } from '@tremor/react'
import { TrendingUp, TrendingDown, Calendar, Bitcoin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sparkline } from './Sparkline'

interface MetricCardProps {
  title: string
  value: number | null | undefined
  suffix?: 'USD' | '%'
  date?: string | null
  highlight?: boolean
  trend?: 'up' | 'down'
  index?: number // Pour le stagger animation
  sparklineData?: number[] // Données pour la mini courbe de tendance
}

export function MetricCard({
  title,
  value,
  suffix = 'USD',
  date,
  highlight = false,
  trend,
  index = 0,
  sparklineData,
}: MetricCardProps) {
  // Déterminer les couleurs selon la tendance
  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-400'
    if (trend === 'down') return 'text-red-400'
    return 'text-slate-100'
  }

  const getTrendBgColor = () => {
    if (trend === 'up') return 'bg-emerald-500/10 border-emerald-500/20'
    if (trend === 'down') return 'bg-red-500/10 border-red-500/20'
    return ''
  }

  // Formater la valeur pour l'affichage
  const isPercentage = suffix === '%'

  // Animation variants
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
        ease: 'easeOut' as const
      }
    }
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="h-full"
    >
      <Card
        className={cn(
          'relative overflow-hidden h-full',
          'bg-slate-900/50 backdrop-blur-xl',
          'border border-slate-700/50',
          'hover:border-slate-600/50 hover:shadow-lg hover:shadow-blue-500/5',
          'transition-all duration-300',
          highlight && 'border-blue-500/30 bg-blue-950/20',
          trend && getTrendBgColor()
        )}
        decoration="top"
        decorationColor={highlight ? 'blue' : trend === 'up' ? 'emerald' : trend === 'down' ? 'red' : 'slate'}
      >
        {/* Glow effect pour highlight */}
        {highlight && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/5 pointer-events-none" />
        )}

        <div className="relative z-10">
          {/* Header avec icône */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-400">{title}</p>
            {highlight && (
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Bitcoin className="w-4 h-4 text-blue-400" />
              </div>
            )}
          </div>

          {/* Valeur principale avec CountUp */}
          <div className="flex items-center gap-3">
            <p className={cn(
              'text-3xl font-bold tracking-tight',
              getTrendColor(),
              !trend && 'text-slate-100'
            )}>
              {value === null || value === undefined ? (
                '—'
              ) : isPercentage ? (
                <>
                  {value > 0 ? '+' : ''}
                  <CountUp
                    end={value}
                    decimals={2}
                    duration={1.5}
                    delay={index * 0.1}
                    preserveValue
                  />
                  %
                </>
              ) : (
                <>
                  $<CountUp
                    end={value}
                    separator=","
                    decimals={0}
                    duration={1.5}
                    delay={index * 0.1}
                    preserveValue
                  />
                </>
              )}
            </p>

            {/* Badge de tendance */}
            {trend && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                  trend === 'up'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                )}
              >
                {trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{trend === 'up' ? 'Hausse' : 'Baisse'}</span>
              </motion.div>
            )}
          </div>

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 1 && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              className="mt-3 -mx-2"
              style={{ originX: 0 }}
            >
              <Sparkline
                data={sparklineData}
                color={trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#3b82f6'}
                height={36}
              />
            </motion.div>
          )}

          {/* Date */}
          {date && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center gap-1.5 mt-3 text-xs text-slate-500"
            >
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
