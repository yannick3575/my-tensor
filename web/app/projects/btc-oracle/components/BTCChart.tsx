'use client'

/**
 * BTCChart - Graphique premium avec animations
 *
 * Utilise Recharts avec:
 * - Ligne continue pour l'historique (bleu avec gradient)
 * - Ligne pointillée pour la prédiction (cyan)
 * - Zone ombrée pour l'intervalle de confiance
 * - ReferenceLine verticale pour "Aujourd'hui"
 * - Animations d'entrée avec Framer Motion
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
  ComposedChart,
} from 'recharts'
import { ChartDataPoint } from '@/lib/supabase/types'

interface BTCChartProps {
  data: ChartDataPoint[]
}

interface TooltipPayloadEntry {
  name: string
  value: number
  color: string
  dataKey: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}

// Formatter pour les tooltips
const formatPrice = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Custom tooltip premium
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  // Filtrer les entrées valides et éviter les doublons
  const validEntries = payload.filter(
    (entry) =>
      entry.value !== null &&
      entry.value !== undefined &&
      entry.dataKey !== 'upperBound' &&
      entry.dataKey !== 'lowerBound'
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-slate-700/50 bg-slate-900/95 backdrop-blur-xl p-4 shadow-2xl"
    >
      <p className="font-semibold text-slate-300 mb-2 text-sm">{label}</p>
      <div className="space-y-1.5">
        {validEntries.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-slate-400">{entry.name}</span>
            </div>
            <span
              className="text-sm font-bold"
              style={{ color: entry.color }}
            >
              {formatPrice(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// Custom Legend
function CustomLegend() {
  return (
    <div className="flex items-center justify-center gap-6 mt-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-blue-500 rounded-full" />
        <span className="text-slate-400">Prix réel</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-cyan-400 rounded-full" style={{ borderStyle: 'dashed', borderWidth: '1px 0 0 0', borderColor: '#22d3ee' }} />
        <span className="text-slate-400">Prédiction</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-3 bg-cyan-400/20 rounded" />
        <span className="text-slate-400">Intervalle 95%</span>
      </div>
    </div>
  )
}

export function BTCChart({ data }: BTCChartProps) {
  // Trouver le point de prédiction et le dernier point réel
  const { predictionPoint, lastActualDate } = useMemo(() => {
    const prediction = data.find((d) => d.predicted !== null && d.actual === null)
    const lastActual = [...data].reverse().find((d) => d.actual !== null)
    return {
      predictionPoint: prediction,
      lastActualDate: lastActual?.date || null,
    }
  }, [data])

  // Vérifier si on a des données d'intervalle de confiance
  const hasConfidenceInterval = useMemo(
    () => data.some((d) => d.lowerBound !== null && d.upperBound !== null),
    [data]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="h-[400px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
        >
          {/* Définition des gradients */}
          <defs>
            {/* Gradient pour la zone sous la courbe historique */}
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
            {/* Gradient pour l'intervalle de confiance */}
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
            </linearGradient>
            {/* Gradient pour la ligne de prédiction */}
            <linearGradient id="predictionLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={1} />
            </linearGradient>
          </defs>

          {/* Grille subtile */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#334155"
            strokeOpacity={0.3}
            vertical={false}
          />

          {/* Axe X - Dates */}
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#334155', strokeOpacity: 0.5 }}
            dy={10}
          />

          {/* Axe Y - Prix */}
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            domain={['auto', 'auto']}
            dx={-10}
          />

          {/* Tooltip interactif */}
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: '#64748b',
              strokeWidth: 1,
              strokeDasharray: '5 5',
            }}
          />

          {/* Ligne de référence "Aujourd'hui" */}
          {lastActualDate && (
            <ReferenceLine
              x={lastActualDate}
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: "Aujourd'hui",
                position: 'top',
                fill: '#64748b',
                fontSize: 10,
                fontWeight: 500,
              }}
            />
          )}

          {/* Zone sous la courbe historique */}
          <Area
            type="monotone"
            dataKey="actual"
            stroke="none"
            fill="url(#actualGradient)"
            connectNulls={false}
            legendType="none"
          />

          {/* Zone d'intervalle de confiance */}
          {hasConfidenceInterval && (
            <Area
              type="monotone"
              dataKey="upperBound"
              stroke="none"
              fill="url(#confidenceGradient)"
              connectNulls={false}
              legendType="none"
            />
          )}
          {hasConfidenceInterval && (
            <Area
              type="monotone"
              dataKey="lowerBound"
              stroke="none"
              fill="#030712"
              fillOpacity={1}
              connectNulls={false}
              legendType="none"
            />
          )}

          {/* Ligne du prix réel - Bleue continue */}
          <Line
            type="monotone"
            dataKey="actual"
            name="Prix réel"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 6,
              strokeWidth: 2,
              stroke: '#3b82f6',
              fill: '#030712',
            }}
            connectNulls={false}
          />

          {/* Ligne de prédiction - Cyan pointillée */}
          <Line
            type="monotone"
            dataKey="predicted"
            name="Prédiction"
            stroke="#22d3ee"
            strokeWidth={2.5}
            strokeDasharray="8 4"
            dot={false}
            activeDot={{
              r: 6,
              strokeWidth: 2,
              stroke: '#22d3ee',
              fill: '#030712',
            }}
            connectNulls={false}
          />

          {/* Point de prédiction mis en évidence avec glow */}
          {predictionPoint && (
            <>
              {/* Glow effect */}
              <ReferenceDot
                x={predictionPoint.date}
                y={predictionPoint.predicted!}
                r={16}
                fill="#22d3ee"
                fillOpacity={0.2}
                stroke="none"
              />
              {/* Point principal */}
              <ReferenceDot
                x={predictionPoint.date}
                y={predictionPoint.predicted!}
                r={8}
                fill="#22d3ee"
                stroke="#030712"
                strokeWidth={3}
              />
              {/* Point central */}
              <ReferenceDot
                x={predictionPoint.date}
                y={predictionPoint.predicted!}
                r={3}
                fill="#030712"
                stroke="none"
              />
            </>
          )}

          {/* Légende custom */}
          <Legend content={<CustomLegend />} />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
