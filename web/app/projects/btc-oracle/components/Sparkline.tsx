'use client'

/**
 * Sparkline - Mini graphique de tendance
 *
 * Affiche une petite courbe de tendance sur les 7 derniers jours.
 */

import { Line, LineChart, ResponsiveContainer } from 'recharts'

interface SparklineProps {
  data: number[]
  color?: string
  height?: number
}

export function Sparkline({
  data,
  color = '#3b82f6',
  height = 32
}: SparklineProps) {
  // Convertir les données en format Recharts
  const chartData = data.map((value, index) => ({ value, index }))

  // Déterminer si la tendance est positive
  const isPositive = data.length >= 2 && data[data.length - 1] > data[0]
  const lineColor = color === 'auto'
    ? isPositive ? '#22c55e' : '#ef4444'
    : color

  if (data.length < 2) return null

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={true}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
