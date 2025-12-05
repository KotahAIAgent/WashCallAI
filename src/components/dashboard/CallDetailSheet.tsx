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
              <Badge variant={call.direction === 'inbound' ? 'default' : 'secondary'}>
                {call.direction}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant="outline">{call.status}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">From</p>
              <p className="text-sm">{call.from_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">To</p>
              <p className="text-sm">{call.to_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Duration</p>
              <p className="text-sm">{call.duration_seconds ? `${call.duration_seconds}s` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="text-sm">{format(new Date(call.created_at), 'MMM d, yyyy h:mm a')}</p>
            </div>
          </div>

          {call.summary && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Summary</p>
              <p className="text-sm bg-muted p-3 rounded-md">{call.summary}</p>
            </div>
          )}

          {call.transcript && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Transcript</p>
              <div className="text-sm bg-muted p-3 rounded-md max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{call.transcript}</pre>
              </div>
            </div>
          )}

          {call.recording_url && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Recording</p>
              <audio controls className="w-full">
                <source src={call.recording_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

