'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Database } from '@/types/database'
import { format } from 'date-fns'
import { Eye } from 'lucide-react'

type Call = Database['public']['Tables']['calls']['Row']

export function CallDetailSheet({ call }: { call: Call }) {
  const [open, setOpen] = useState(false)

  // Safely handle potentially null/undefined values
  const safeDate = call.created_at ? new Date(call.created_at) : new Date()
  const safeDirection = call.direction || 'unknown'
  const safeStatus = call.status || 'unknown'
  const safeFrom = call.from_number || 'N/A'
  const safeTo = call.to_number || 'N/A'
  const safeDuration = call.duration_seconds || 0
  const safeSummary = call.summary || null
  const safeTranscript = call.transcript || null
  const safeRecordingUrl = call.recording_url || null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Call Details</SheetTitle>
          <SheetDescription>
            View call information, transcript, and summary
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Direction</p>
              <Badge variant={safeDirection === 'inbound' ? 'default' : 'secondary'}>
                {safeDirection}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant="outline">{safeStatus}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">From</p>
              <p className="text-sm">{safeFrom}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">To</p>
              <p className="text-sm">{safeTo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Duration</p>
              <p className="text-sm">{safeDuration > 0 ? `${safeDuration}s` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="text-sm">
                {isNaN(safeDate.getTime()) ? 'N/A' : format(safeDate, 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>

          {safeSummary && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Summary</p>
              <p className="text-sm bg-muted p-3 rounded-md">{safeSummary}</p>
            </div>
          )}

          {safeTranscript && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Transcript</p>
              <div className="text-sm bg-muted p-3 rounded-md max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{safeTranscript}</pre>
              </div>
            </div>
          )}

          {safeRecordingUrl && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Recording</p>
              <audio controls className="w-full">
                <source src={safeRecordingUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {!safeSummary && !safeTranscript && !safeRecordingUrl && (
            <div className="text-sm text-muted-foreground italic text-center py-4">
              No transcript, summary, or recording available for this call
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

