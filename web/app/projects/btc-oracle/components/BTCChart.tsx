'use client'

/**
 * BTCChart - Client Component pour afficher le graphique
 *
 * Utilise Recharts pour visualiser:
 * - Ligne continue bleue: Prix réel historique
 * - Point/ligne pointillée orange: Prédiction
 *
 * "use client" est nécessaire car:
 * - Recharts utilise des refs, state, et event handlers
 * - Il a besoin du DOM pour le rendu canvas/SVG
 */

import { useMemo } from 'react'
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

// Custom tooltip - défini en dehors du composant pour éviter les re-renders
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p
          key={index}
          className="text-sm"
          style={{ color: entry.color }}
        >
          {entry.name}: {formatPrice(entry.value)}
        </p>
      ))}
    </div>
  )
}

export function BTCChart({ data }: BTCChartProps) {
  // Trouver le point de prédiction (dernier point avec predicted != null)
  // Mémoïsé pour éviter recalcul à chaque render
  const predictionPoint = useMemo(
    () => data.find((d) => d.predicted !== null && d.actual === null),
    [data]
  )

  // Vérifier si on a des données d'intervalle de confiance
  const hasConfidenceInterval = useMemo(
    () => data.some((d) => d.lowerBound !== null && d.upperBound !== null),
    [data]
  )

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {/* Grille de fond */}
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted"
          />

          {/* Axe X - Dates */}
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />

          {/* Axe Y - Prix */}
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            domain={['auto', 'auto']}
            className="text-muted-foreground"
          />

          {/* Tooltip interactif */}
          <Tooltip content={<CustomTooltip />} />

          {/* Légende */}
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />

          {/* Zone d'intervalle de confiance - Orange semi-transparent */}
          {hasConfidenceInterval && (
            <Area
              type="monotone"
              dataKey="upperBound"
              stroke="none"
              fill="hsl(25, 95%, 53%)"
              fillOpacity={0.15}
              name="Intervalle 95%"
              connectNulls={false}
            />
          )}
          {hasConfidenceInterval && (
            <Area
              type="monotone"
              dataKey="lowerBound"
              stroke="none"
              fill="white"
              fillOpacity={1}
              legendType="none"
              connectNulls={false}
            />
          )}

          {/* Ligne du prix réel - Bleue continue */}
          <Line
            type="monotone"
            dataKey="actual"
            name="Prix réel"
            stroke="hsl(217, 91%, 60%)"  // Bleu
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
            connectNulls={false}
          />

          {/* Ligne de prédiction - Orange pointillée */}
          <Line
            type="monotone"
            dataKey="predicted"
            name="Prédiction"
            stroke="hsl(25, 95%, 53%)"  // Orange
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 6, fill: 'hsl(25, 95%, 53%)' }}
            activeDot={{ r: 8, strokeWidth: 2 }}
            connectNulls={false}
          />

          {/* Point de prédiction mis en évidence */}
          {predictionPoint && (
            <ReferenceDot
              x={predictionPoint.date}
              y={predictionPoint.predicted!}
              r={8}
              fill="hsl(25, 95%, 53%)"
              stroke="white"
              strokeWidth={2}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
