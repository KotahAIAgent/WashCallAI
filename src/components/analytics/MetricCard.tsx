'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: LucideIcon
  description?: string
}

function CountUp({ end, duration = 1 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return <span>{count}</span>
}

export function MetricCard({ title, value, change, icon: Icon, description }: MetricCardProps) {
  const isNumber = typeof value === 'number' && !isNaN(value)
  const displayValue = isNumber ? <CountUp end={value} /> : value

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{displayValue}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {change !== undefined && (
              <>
                {change > 0 ? (
                  <>
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+{change}%</span>
                  </>
                ) : change < 0 ? (
                  <>
                    <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                    <span className="text-red-500">{change}%</span>
                  </>
                ) : (
                  <span>No change</span>
                )}
                <span className="ml-1">from last month</span>
              </>
            )}
            {change === undefined && description && (
              <span>{description}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

