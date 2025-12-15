'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createCampaign } from '@/lib/campaigns/actions'
import { useToast } from '@/hooks/use-toast'
import { Database } from '@/types/database'
import { Clock, Calendar, Loader2 } from 'lucide-react'

type PhoneNumber = Database['public']['Tables']['phone_numbers']['Row']

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
]

export function NewCampaignForm({
  organizationId,
  phoneNumbers,
}: {
  organizationId: string
  phoneNumbers: PhoneNumber[]
}) {
  const [loading, setLoading] = useState(false)
  const [enabledDays, setEnabledDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
  const router = useRouter()
  const { toast } = useToast()

  function toggleDay(dayId: string) {
    setEnabledDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((d) => d !== dayId)
        : [...prev, dayId]
    )
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.append('organizationId', organizationId)
    formData.append('enabledDays', JSON.stringify(enabledDays))
    
    const result = await createCampaign(formData)
    
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
      setLoading(false)
    } else {
      toast({
        title: 'Success',
        description: 'Campaign created successfully',
      })
      router.push(`/app/campaigns/${result.campaignId}`)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Restaurant Cold Calls - January"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the goal and target audience for this campaign..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scriptType">Call Script Type</Label>
        <Select name="scriptType" defaultValue="general">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General Outreach</SelectItem>
            <SelectItem value="cold_restaurants">Restaurant Cold Calls</SelectItem>
            <SelectItem value="property_managers">Property Managers</SelectItem>
            <SelectItem value="past_customers">Past Customer Follow-up</SelectItem>
            <SelectItem value="new_leads">New Lead Follow-up</SelectItem>
            <SelectItem value="estimate_reminder">Estimate Reminders</SelectItem>
            <SelectItem value="invoice_followup">Invoice Follow-up</SelectItem>
            <SelectItem value="form_lead_warm_call">Form Lead Warm Call</SelectItem>
            <SelectItem value="company_cold_call">Company Cold Call</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          The AI will use a script optimized for this campaign type
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumberId">Caller ID (Phone Number)</Label>
        {phoneNumbers.length > 0 ? (
          <Select name="phoneNumberId" defaultValue={phoneNumbers[0]?.id}>
            <SelectTrigger>
              <SelectValue placeholder="Select a phone number" />
            </SelectTrigger>
            <SelectContent>
              {phoneNumbers.map((phone) => (
                <SelectItem key={phone.id} value={phone.id}>
                  {phone.friendly_name || phone.phone_number} ({phone.phone_number})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-amber-600 p-3 bg-amber-50 rounded-lg">
            No phone numbers available. Contact support to add phone numbers to your account.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dailyLimit">Daily Call Limit</Label>
        <Input
          id="dailyLimit"
          name="dailyLimit"
          type="number"
          defaultValue={50}
          min={1}
          max={100}
        />
        <p className="text-sm text-muted-foreground">
          Maximum calls per day for this campaign (max 100)
        </p>
      </div>

      {/* Schedule Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Label className="text-base font-semibold">Call Schedule</Label>
        </div>

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
                >
                  {day.label}
                </button>
              )
            })}
          </div>
        </div>

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
                defaultValue="09:00"
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
                defaultValue="17:00"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select name="timezone" defaultValue="America/New_York">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
              <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
              <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
              <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
              <SelectItem value="America/Phoenix">Arizona Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Campaign'
          )}
        </Button>
      </div>
    </form>
  )
}

