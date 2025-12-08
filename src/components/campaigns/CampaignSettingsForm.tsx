'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateCampaign } from '@/lib/campaigns/actions'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database'
import { Calendar, Clock, Phone, AlertTriangle } from 'lucide-react'

type Campaign = Database['public']['Tables']['campaigns']['Row'] & {
  phone_numbers?: { phone_number: string; friendly_name: string | null } | null
}
type PhoneNumber = Database['public']['Tables']['phone_numbers']['Row']

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Mon', fullLabel: 'Monday' },
  { id: 'tuesday', label: 'Tue', fullLabel: 'Tuesday' },
  { id: 'wednesday', label: 'Wed', fullLabel: 'Wednesday' },
  { id: 'thursday', label: 'Thu', fullLabel: 'Thursday' },
  { id: 'friday', label: 'Fri', fullLabel: 'Friday' },
  { id: 'saturday', label: 'Sat', fullLabel: 'Saturday' },
  { id: 'sunday', label: 'Sun', fullLabel: 'Sunday' },
]

type ScheduleConfig = {
  enabledDays: string[]
  startTime: string
  endTime: string
  timezone: string
}

export function CampaignSettingsForm({
  campaign,
  phoneNumbers,
  organizationId,
}: {
  campaign: Campaign
  phoneNumbers: PhoneNumber[]
  organizationId: string
}) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const schedule = (campaign.schedule as ScheduleConfig) || {
    enabledDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'America/New_York',
  }

  const [enabledDays, setEnabledDays] = useState<string[]>(schedule.enabledDays || [])

  function toggleDay(dayId: string) {
    setEnabledDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((d) => d !== dayId)
        : [...prev, dayId]
    )
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.append('campaignId', campaign.id)
    formData.append('enabledDays', JSON.stringify(enabledDays))
    
    const result = await updateCampaign(formData)
    
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Campaign settings updated successfully',
      })
      router.push(`/app/campaigns/${campaign.id}`)
      router.refresh()
    }
    
    setLoading(false)
  }

  // Filter phone numbers that can be used for outbound
  const outboundPhones = phoneNumbers.filter(p => p.type === 'outbound' || p.type === 'both')

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Campaign Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={campaign.name}
          required
          placeholder="My Campaign"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={campaign.description || ''}
          placeholder="Optional description for this campaign"
          rows={3}
        />
      </div>

      {/* Script Type */}
      <div className="space-y-2">
        <Label htmlFor="scriptType">Campaign Type</Label>
        <Select name="scriptType" defaultValue={campaign.script_type || 'general'}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General Outreach</SelectItem>
            <SelectItem value="past_customers">Past Customer Follow-up</SelectItem>
            <SelectItem value="new_leads">New Lead Follow-up</SelectItem>
            <SelectItem value="estimate_reminder">Estimate Reminders</SelectItem>
            <SelectItem value="appointment_reminder">Appointment Reminders</SelectItem>
            <SelectItem value="maintenance_recall">Maintenance Recall</SelectItem>
            <SelectItem value="commercial_outreach">Commercial Outreach</SelectItem>
            <SelectItem value="reactivation">Customer Reactivation</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Your AI agent uses different scripts optimized for each campaign type
        </p>
      </div>

      {/* Phone Number Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-muted-foreground" />
          <Label className="text-base font-semibold">Caller ID Selection</Label>
        </div>
        {outboundPhones.length > 0 ? (
          <Select name="phoneNumberId" defaultValue={campaign.phone_number_id || ''}>
            <SelectTrigger>
              <SelectValue placeholder="Select a phone number" />
            </SelectTrigger>
            <SelectContent>
              {outboundPhones.map((phone) => (
                <SelectItem key={phone.id} value={phone.id}>
                  <div className="flex items-center gap-2">
                    <span>{phone.friendly_name || phone.phone_number}</span>
                    <span className="text-muted-foreground">({phone.phone_number})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="p-4 rounded-lg border border-dashed text-center">
            <Phone className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No phone numbers available. Contact FusionCaller support to add phone numbers.
            </p>
          </div>
        )}
      </div>

      {/* Daily Call Limit */}
      <div className="space-y-2">
        <Label htmlFor="dailyLimit">Daily Call Limit</Label>
        <Input
          id="dailyLimit"
          name="dailyLimit"
          type="number"
          defaultValue={campaign.daily_limit || 50}
          min="1"
          max="100"
        />
        <p className="text-sm text-muted-foreground">
          Maximum calls per day for this campaign (max 100 to avoid spam flags)
        </p>
      </div>

      {/* Call Schedule Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Label className="text-base font-semibold">Call Schedule</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Set when your AI can make calls for this campaign
        </p>

        {/* Days of Week */}
        <div className="space-y-3">
          <Label>Active Days</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isEnabled = enabledDays.includes(day.id)
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${isEnabled
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }
                  `}
                  title={day.fullLabel}
                >
                  {day.label}
                </button>
              )
            })}
          </div>
          {enabledDays.length === 0 && (
            <p className="text-sm text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              No days selected - calls will not be made
            </p>
          )}
        </div>

        {/* Time Window */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label>Calling Hours</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-sm text-muted-foreground">
                Start Time
              </Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                defaultValue={schedule.startTime || '09:00'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-sm text-muted-foreground">
                End Time
              </Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                defaultValue={schedule.endTime || '17:00'}
              />
            </div>
          </div>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select name="timezone" defaultValue={schedule.timezone || 'America/New_York'}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
              <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
              <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
              <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
              <SelectItem value="America/Phoenix">Arizona Time</SelectItem>
              <SelectItem value="America/Anchorage">Alaska Time</SelectItem>
              <SelectItem value="Pacific/Honolulu">Hawaii Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}

