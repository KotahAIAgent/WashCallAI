'use client'

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
  
  // Show every 5th label to avoid crowding
  const showLabel = (index: number) => index % 5 === 0 || index === data.length - 1

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="flex items-end justify-between gap-1 h-64">
        {data.map((day, index) => {
          const inboundHeight = (day.inbound / maxValue) * 100
          const outboundHeight = (day.outbound / maxValue) * 100
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-center mb-1 whitespace-nowrap">
                <div className="font-medium">{day.date}</div>
                <div className="text-green-600">{day.inbound} in</div>
                <div className="text-blue-600">{day.outbound} out</div>
              </div>
              
              {/* Stacked bars */}
              <div className="w-full flex flex-col items-center justify-end h-48">
                {/* Outbound on top */}
                <div 
                  className="w-full max-w-3 bg-blue-500 rounded-t transition-all duration-300 group-hover:bg-blue-600"
                  style={{ 
                    height: `${outboundHeight}%`,
                    minHeight: day.outbound > 0 ? '2px' : '0'
                  }}
                />
                {/* Inbound on bottom */}
                <div 
                  className="w-full max-w-3 bg-green-500 transition-all duration-300 group-hover:bg-green-600"
                  style={{ 
                    height: `${inboundHeight}%`,
                    minHeight: day.inbound > 0 ? '2px' : '0',
                    borderRadius: day.outbound === 0 ? '2px 2px 0 0' : '0'
                  }}
                />
              </div>
              
              {/* Date label */}
              {showLabel(index) && (
                <span className="text-xs text-muted-foreground mt-1 -rotate-45 origin-top-left">
                  {day.date.slice(0, 6)}
                </span>
              )}
            </div>
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
        {data.reduce((acc, d) => acc + d.inbound + d.outbound, 0)} total calls in the last 30 days
      </div>
    </div>
  )
}

