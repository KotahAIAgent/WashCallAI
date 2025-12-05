'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Voicemail,
  Calendar,
  Tag,
  FileText,
  User,
  TrendingUp,
  MessageSquare,
  Mail,
  Loader2,
  Play,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getLeadActivityTimeline } from '@/lib/activity/actions'

interface TimelineItem {
  id: string
  type: string
  title: string
  description?: string
  metadata?: any
  created_at: string
  actor_name?: string
  data?: any
}

interface ActivityTimelineProps {
  leadId: string
}

export function ActivityTimeline({ leadId }: ActivityTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTimeline()
  }, [leadId])

  const loadTimeline = async () => {
    setIsLoading(true)
    const result = await getLeadActivityTimeline(leadId)
    if (!result.error) {
      setTimeline(result.timeline || [])
    }
    setIsLoading(false)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'call_inbound':
        return <PhoneIncoming className="h-4 w-4 text-green-500" />
      case 'call_outbound':
        return <PhoneOutgoing className="h-4 w-4 text-blue-500" />
      case 'call_missed':
        return <PhoneMissed className="h-4 w-4 text-red-500" />
      case 'call_voicemail':
        return <Voicemail className="h-4 w-4 text-orange-500" />
      case 'lead_created':
        return <User className="h-4 w-4 text-purple-500" />
      case 'lead_updated':
      case 'lead_status_changed':
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      case 'appointment_created':
      case 'appointment_updated':
      case 'appointment_cancelled':
        return <Calendar className="h-4 w-4 text-purple-500" />
      case 'tag_added':
      case 'tag_removed':
        return <Tag className="h-4 w-4 text-pink-500" />
      case 'note_added':
        return <FileText className="h-4 w-4 text-yellow-600" />
      case 'email_sent':
        return <Mail className="h-4 w-4 text-blue-500" />
      case 'sms_sent':
        return <MessageSquare className="h-4 w-4 text-green-500" />
      case 'score_updated':
        return <TrendingUp className="h-4 w-4 text-orange-500" />
      default:
        return <Phone className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'call_inbound': return 'Inbound Call'
      case 'call_outbound': return 'Outbound Call'
      case 'call_missed': return 'Missed Call'
      case 'call_voicemail': return 'Voicemail'
      case 'lead_created': return 'Lead Created'
      case 'lead_updated': return 'Lead Updated'
      case 'lead_status_changed': return 'Status Changed'
      case 'appointment_created': return 'Appointment'
      case 'appointment_updated': return 'Appointment Updated'
      case 'appointment_cancelled': return 'Appointment Cancelled'
      case 'tag_added': return 'Tag Added'
      case 'tag_removed': return 'Tag Removed'
      case 'note_added': return 'Note'
      case 'email_sent': return 'Email Sent'
      case 'sms_sent': return 'SMS Sent'
      case 'score_updated': return 'Score Updated'
      default: return 'Activity'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No activity yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={item.id} className="relative flex gap-4">
                  {/* Icon circle */}
                  <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                    {getIcon(item.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(item.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                      {item.actor_name && (
                        <span className="text-xs text-muted-foreground">
                          by {item.actor_name}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm font-medium mt-1">{item.title}</p>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    
                    {/* Call-specific data */}
                    {item.data?.duration && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Duration: {Math.round(item.data.duration)}s
                      </p>
                    )}
                    
                    {/* Recording button */}
                    {item.data?.recording_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        asChild
                      >
                        <a href={item.data.recording_url} target="_blank" rel="noopener noreferrer">
                          <Play className="h-3 w-3 mr-1" />
                          Listen to Recording
                        </a>
                      </Button>
                    )}
                    
                    {/* Appointment time */}
                    {item.data?.start_time && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Scheduled for: {format(new Date(item.data.start_time), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}

                    {/* Pinned note indicator */}
                    {item.data?.pinned && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        📌 Pinned
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

