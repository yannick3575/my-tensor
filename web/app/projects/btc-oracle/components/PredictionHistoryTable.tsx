'use client'

/**
 * PredictionHistoryTable - Tableau premium comparant prédictions vs prix réels
 *
 * Affiche l'historique avec animations et badges colorés selon la précision.
 */

import { motion } from 'framer-motion'
import { PredictionComparison } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertCircle, XCircle, Calendar } from 'lucide-react'

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
  })
}

// Détermine le status selon le pourcentage d'erreur
function getAccuracyStatus(errorPercent: number) {
  const absError = Math.abs(errorPercent)

  if (absError < 5) {
    return {
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      icon: CheckCircle2,
      label: 'Précis',
    }
  } else if (absError < 10) {
    return {
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      icon: AlertCircle,
      label: 'Acceptable',
    }
  } else {
    return {
      color: 'text-red-400',
      bgColor: 'bg-red-500/10 border-red-500/20',
      icon: XCircle,
      label: 'Imprécis',
    }
  }
}

export function PredictionHistoryTable({ history }: PredictionHistoryTableProps) {
  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl p-6 text-center"
      >
        <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Pas encore d&apos;historique de prédictions à afficher.</p>
        <p className="text-sm text-slate-500 mt-2">
          L&apos;historique apparaîtra lorsque des prédictions auront été vérifiées.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/30">
              <th className="text-left p-4 font-medium text-slate-400 text-xs uppercase tracking-wider">
                Date
              </th>
              <th className="text-right p-4 font-medium text-slate-400 text-xs uppercase tracking-wider">
                Prédit
              </th>
              <th className="text-right p-4 font-medium text-slate-400 text-xs uppercase tracking-wider">
                Réel
              </th>
              <th className="text-right p-4 font-medium text-slate-400 text-xs uppercase tracking-wider">
                Erreur
              </th>
              <th className="text-center p-4 font-medium text-slate-400 text-xs uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => {
              const status = getAccuracyStatus(item.errorPercent)
              const Icon = status.icon

              return (
                <motion.tr
                  key={item.date}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={cn(
                    'border-b border-slate-800/50 last:border-0',
                    'transition-colors duration-200',
                    'hover:bg-slate-800/30'
                  )}
                >
                  <td className="p-4 text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      {formatDate(item.date)}
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-300">
                    {formatUSD(item.predicted)}
                  </td>
                  <td className="p-4 text-right font-mono text-slate-100 font-medium">
                    {formatUSD(item.actual)}
                  </td>
                  <td className={cn('p-4 text-right font-mono font-medium', status.color)}>
                    {item.errorPercent > 0 ? '+' : ''}
                    {item.errorPercent.toFixed(2)}%
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                        status.bgColor,
                        status.color
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{status.label}</span>
                    </span>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer avec résumé */}
      <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-800/20">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{history.length} prédictions analysées</span>
          <span>
            {history.filter(h => Math.abs(h.errorPercent) < 5).length} précises
            ({((history.filter(h => Math.abs(h.errorPercent) < 5).length / history.length) * 100).toFixed(0)}%)
          </span>
        </div>
      </div>
    </motion.div>
  )
}
