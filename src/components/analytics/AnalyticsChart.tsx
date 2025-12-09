'use client'

import { motion } from 'framer-motion'

interface ChartData {
  date: string
  inbound: number
  outbound: number
}

interface AnalyticsChartProps {
  data: ChartData[]
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  const maxValue = Math.max(...data.map(d => d.inbound + d.outbound), 1)
  
  // Show all labels for monthly data (usually not too many months)
  const showLabel = (index: number) => true

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="flex items-end justify-between gap-1 h-64">
        {data.map((day, index) => {
          const inboundHeight = (day.inbound / maxValue) * 100
          const outboundHeight = (day.outbound / maxValue) * 100
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.5, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-center mb-1 whitespace-nowrap">
                <div className="font-medium">{day.date}</div>
                <div className="text-green-600">{day.inbound} in</div>
                <div className="text-blue-600">{day.outbound} out</div>
              </div>
              
              {/* Stacked bars */}
              <div className="w-full flex flex-col items-center justify-end h-48">
                {/* Outbound on top */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${outboundHeight}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 + 0.1, ease: [0.4, 0, 0.2, 1] }}
                  className="w-full max-w-3 bg-blue-500 rounded-t transition-colors duration-300 group-hover:bg-blue-600"
                  style={{ 
                    minHeight: day.outbound > 0 ? '2px' : '0'
                  }}
                />
                {/* Inbound on bottom */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${inboundHeight}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 + 0.15, ease: [0.4, 0, 0.2, 1] }}
                  className="w-full max-w-3 bg-green-500 transition-colors duration-300 group-hover:bg-green-600"
                  style={{ 
                    minHeight: day.inbound > 0 ? '2px' : '0',
                    borderRadius: day.outbound === 0 ? '2px 2px 0 0' : '0'
                  }}
                />
              </div>
              
              {/* Date label */}
              {showLabel(index) && (
                <span className="text-xs text-muted-foreground mt-1 -rotate-45 origin-top-left whitespace-nowrap">
                  {day.date}
                </span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-sm text-muted-foreground">Inbound</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-sm text-muted-foreground">Outbound</span>
        </div>
      </div>

      {/* Summary */}
      <div className="text-center text-sm text-muted-foreground">
        {data.reduce((acc, d) => acc + d.inbound + d.outbound, 0)} total calls across {data.length} {data.length === 1 ? 'month' : 'months'}
      </div>
    </div>
  )
}

