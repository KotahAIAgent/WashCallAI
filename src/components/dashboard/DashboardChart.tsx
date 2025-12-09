'use client'

import { motion } from 'framer-motion'

interface ChartData {
  date: string
  inbound: number
  outbound: number
  total: number
}

interface DashboardChartProps {
  data: ChartData[]
}

export function DashboardChart({ data }: DashboardChartProps) {
  const maxValue = Math.max(...data.map(d => d.total), 1)
  
  return (
    <div className="space-y-4">
      {/* Simple bar chart */}
      <div className="flex items-end justify-between gap-2 h-48 overflow-x-auto pb-2">
        {data.map((day, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 flex flex-col items-center gap-2"
          >
            <div className="w-full flex flex-col items-center justify-end h-40 gap-0.5">
              {/* Outbound bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${maxValue > 0 ? (day.outbound / maxValue * 100) : 0}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.1, ease: [0.4, 0, 0.2, 1] }}
                className="w-full max-w-8 bg-blue-500 rounded-t transition-colors duration-300 hover:bg-blue-600"
                style={{ 
                  minHeight: day.outbound > 0 ? '4px' : '0'
                }}
              />
              {/* Inbound bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${maxValue > 0 ? (day.inbound / maxValue * 100) : 0}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.15, ease: [0.4, 0, 0.2, 1] }}
                className="w-full max-w-8 bg-green-500 rounded-b transition-colors duration-300 hover:bg-green-600"
                style={{ 
                  minHeight: day.inbound > 0 ? '4px' : '0'
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{day.date}</span>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-2 border-t">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-sm text-muted-foreground">Inbound</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-sm text-muted-foreground">Outbound</span>
        </div>
      </div>

      {/* Total summary */}
      <div className="text-center text-sm text-muted-foreground">
        {data.reduce((acc, d) => acc + d.total, 0)} total calls this week
      </div>
    </div>
  )
}

