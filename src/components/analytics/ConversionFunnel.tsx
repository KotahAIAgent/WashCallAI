'use client'

import { motion } from 'framer-motion'

interface FunnelStage {
  name: string
  value: number
  percentage: number
  color?: string
}

interface ConversionFunnelProps {
  stages: FunnelStage[]
}

const DEFAULT_COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe']

export function ConversionFunnel({ stages }: ConversionFunnelProps) {
  const maxValue = Math.max(...stages.map(s => s.value), 1)

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const width = (stage.value / maxValue) * 100
        const color = stage.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
        
        return (
          <motion.div
            key={stage.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{stage.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{stage.value}</span>
                <span className="text-xs text-muted-foreground">({stage.percentage}%)</span>
              </div>
            </div>
            <div className="relative h-8 rounded-lg bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 + 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="h-full rounded-lg"
                style={{ backgroundColor: color }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

