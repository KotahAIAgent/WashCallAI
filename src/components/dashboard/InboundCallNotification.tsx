'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PhoneIncoming, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Database } from '@/types/database'

type Call = Database['public']['Tables']['calls']['Row']

interface InboundCallNotificationProps {
  organizationId: string
}

export function InboundCallNotification({ organizationId }: InboundCallNotificationProps) {
  const [newCall, setNewCall] = useState<Call | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const processedCallIdsRef = useRef<Set<string>>(new Set())
  const componentMountedTimeRef = useRef<number>(Date.now())
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current
    const mountedTime = componentMountedTimeRef.current

    // Subscribe to new calls for this organization
    const channel = supabase
      .channel(`inbound-calls-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const call = payload.new as Call
          
          // Only show popup for inbound calls
          if (call.direction === 'inbound') {
            // Check if we've already processed this call
            const callId = call.id
            if (!processedCallIdsRef.current.has(callId)) {
              // Only show if the call was created after component mounted
              // This prevents showing old calls when the page first loads
              const callCreatedAt = new Date(call.created_at).getTime()
              if (callCreatedAt >= mountedTime - 5000) { // Allow 5 second buffer for timing
                processedCallIdsRef.current.add(callId)
                setNewCall(call)
                setIsOpen(true)
              }
            }
          }
        }
      )
      .subscribe()

    // Also listen for updates to existing calls (in case transcript/summary comes later)
    const updateChannel = supabase
      .channel(`call-updates-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const call = payload.new as Call
          
          // If this is an inbound call and we're currently showing it, update it
          if (call.direction === 'inbound' && newCall?.id === call.id) {
            setNewCall(call)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(updateChannel)
    }
  }, [organizationId, newCall])

  const handleClose = () => {
    setIsOpen(false)
    // Keep the call data for a bit in case user wants to reopen
    setTimeout(() => {
      setNewCall(null)
    }, 5000)
  }

  if (!newCall) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 text-green-600">
              <PhoneIncoming className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <DialogTitle>New Inbound Call</DialogTitle>
              <DialogDescription>
                A new call has just come in
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Call Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Direction</p>
              <Badge variant="default" className="bg-green-500">
                Inbound
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
              <Badge variant="outline">{newCall.status}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">From</p>
              <p className="text-sm font-medium">{newCall.from_number || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">To</p>
              <p className="text-sm font-medium">{newCall.to_number || 'Unknown'}</p>
            </div>
            {newCall.duration_seconds && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Duration</p>
                <p className="text-sm">{newCall.duration_seconds}s</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Time</p>
              <p className="text-sm">{format(new Date(newCall.created_at), 'MMM d, yyyy h:mm a')}</p>
            </div>
          </div>

          {/* Summary */}
          {newCall.summary ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Summary</p>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{newCall.summary}</p>
              </div>
            </div>
          ) : newCall.status === 'completed' || newCall.status === 'answered' ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Summary</p>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground italic">Summary is being generated...</p>
              </div>
            </div>
          ) : null}

          {/* Transcript */}
          {newCall.transcript ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Transcript</p>
              <div className="bg-muted p-4 rounded-md max-h-64 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-sans">{newCall.transcript}</pre>
              </div>
            </div>
          ) : newCall.status === 'completed' || newCall.status === 'answered' ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Transcript</p>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground italic">Transcript is being processed...</p>
              </div>
            </div>
          ) : null}

          {/* Recording */}
          {newCall.recording_url && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Recording</p>
              <audio controls className="w-full">
                <source src={newCall.recording_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Close
            </Button>
            <Link href="/app/calls" className="flex-1">
              <Button className="w-full">
                View All Calls
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

