'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AutoRefreshProps {
  interval?: number // Refresh interval in milliseconds (default: 30 seconds)
}

export function AutoRefresh({ interval = 30000 }: AutoRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    // Set up auto-refresh interval
    const refreshInterval = setInterval(() => {
      router.refresh() // Refresh the server component data
    }, interval)

    // Clean up interval on unmount
    return () => clearInterval(refreshInterval)
  }, [router, interval])

  // This component doesn't render anything
  return null
}

