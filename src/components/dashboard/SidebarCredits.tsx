'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2 } from 'lucide-react'
import Link from 'next/link'

export function SidebarCredits() {
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCredits() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', session.user.id)
          .single()

        if (profile?.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('purchased_credits_minutes')
            .eq('id', profile.organization_id)
            .single()

          setCredits(org?.purchased_credits_minutes || 0)
        }
      } catch (error) {
        console.error('Error fetching credits:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()
    
    // Refresh credits every 30 seconds
    const interval = setInterval(fetchCredits, 30000)
    return () => clearInterval(interval)
  }, [supabase])

  if (loading) {
    return (
      <div className="px-4 py-3 border-t border-border/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading credits...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 border-t border-border/50 bg-muted/30">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Available Credits</span>
          </div>
          <span className="text-sm font-bold text-foreground">
            {credits !== null ? credits.toLocaleString() : '0'} min
          </span>
        </div>
        <Link href="/app/disputes" className="w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs h-8"
          >
            Purchase More
          </Button>
        </Link>
      </div>
    </div>
  )
}

