'use client'

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
      <div className="flex items-end justify-between gap-2 h-48">
        {data.map((day, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col items-center justify-end h-40 gap-0.5">
              {/* Outbound bar */}
              <div 
                className="w-full max-w-8 bg-blue-500 rounded-t transition-all duration-300"
                style={{ 
                  height: `${maxValue > 0 ? (day.outbound / maxValue * 100) : 0}%`,
                  minHeight: day.outbound > 0 ? '4px' : '0'
                }}
              />
              {/* Inbound bar */}
              <div 
                className="w-full max-w-8 bg-green-500 rounded-b transition-all duration-300"
                style={{ 
                  height: `${maxValue > 0 ? (day.inbound / maxValue * 100) : 0}%`,
                  minHeight: day.inbound > 0 ? '4px' : '0'
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{day.date}</span>
          </div>
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

