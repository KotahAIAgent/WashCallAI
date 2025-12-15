'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { updateOutboundConfig } from '@/lib/agents/actions'
import { useToast } from '@/hooks/use-toast'
import { Database } from '@/types/database'
import { Clock, Calendar, Phone, AlertTriangle, CheckCircle2, Building2, Briefcase } from 'lucide-react'
import { VoiceSelector } from '@/components/agents/VoiceSelector'
import { PromptChangeRequest } from '@/components/agents/PromptChangeRequest'

type AgentConfig = Database['public']['Tables']['agent_configs']['Row']
type PhoneNumber = Database['public']['Tables']['phone_numbers']['Row']

type ScheduleConfig = {
  enabledDays: string[]
  startTime: string
  endTime: string
  timezone: string
}

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Mon', fullLabel: 'Monday' },
  { id: 'tuesday', label: 'Tue', fullLabel: 'Tuesday' },
  { id: 'wednesday', label: 'Wed', fullLabel: 'Wednesday' },
  { id: 'thursday', label: 'Thu', fullLabel: 'Thursday' },
  { id: 'friday', label: 'Fri', fullLabel: 'Friday' },
  { id: 'saturday', label: 'Sat', fullLabel: 'Saturday' },
  { id: 'sunday', label: 'Sun', fullLabel: 'Sunday' },
]

const DEFAULT_ENABLED_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const DEFAULT_START_TIME = '09:00'
const DEFAULT_END_TIME = '17:00'

export function OutboundConfigForm({
  organizationId,
  config,
  phoneNumbers,
}: {
  organizationId: string
  config: AgentConfig | null
  phoneNumbers: PhoneNumber[]
}) {
  const [loading, setLoading] = useState(false)
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>(
    phoneNumbers.find(p => p.type === 'outbound' || p.type === 'both')?.id || ''
  )
  const { toast } = useToast()

  const schedule = config?.schedule as ScheduleConfig | null
  const [enabledDays, setEnabledDays] = useState<string[]>(
    schedule?.enabledDays || DEFAULT_ENABLED_DAYS
  )

  // Get the selected phone number details
  const selectedPhone = phoneNumbers.find(p => p.id === selectedPhoneId)
  const callsRemaining = selectedPhone ? selectedPhone.daily_limit - selectedPhone.calls_today : 0
  const limitPercentage = selectedPhone ? (selectedPhone.calls_today / selectedPhone.daily_limit) * 100 : 0

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
    formData.append('selectedPhoneId', selectedPhoneId)
    // introductionStyle is already in formData from the Select component
    
    const result = await updateOutboundConfig(formData)
    
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Outbound Agent configuration saved successfully',
      })
    }
    
    setLoading(false)
  }

  // Filter phone numbers that can be used for outbound
  const outboundPhones = phoneNumbers.filter(p => p.type === 'outbound' || p.type === 'both')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Outbound Agent Configuration</CardTitle>
        <CardDescription>Configure your AI agent for outbound calling campaigns</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          
          {/* Agent Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {config?.outbound_enabled ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="font-medium">Agent Status</p>
                <p className="text-sm text-muted-foreground">
                  {config?.outbound_agent_id 
                    ? 'Your outbound agent is configured and ready'
                    : 'Create your AI assistant below to get started'}
                </p>
              </div>
            </div>
            <Badge variant={config?.outbound_agent_id ? 'default' : 'outline'}>
              {config?.outbound_agent_id ? 'Configured' : 'Setup Required'}
            </Badge>
          </div>

          {!config?.outbound_agent_id && (
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <p className="text-sm font-medium text-amber-900">
                  Your outbound agent is being set up by our team. You'll be notified when it's ready.
                </p>
              </div>
            </div>
          )}

          {config?.outbound_agent_id && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Agent Configured</span>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  Active
                </Badge>
              </div>
            </div>
          )}

          {/* Voice Selection and Prompt Change Request */}
          {config?.outbound_agent_id && (
            <div className="space-y-4">
              <VoiceSelector
                organizationId={organizationId}
                agentType="outbound"
                currentVoiceId={config.voice_id}
                currentVoiceName={config.voice_name}
              />
              
              <PromptChangeRequest
                organizationId={organizationId}
                agentType="outbound"
              />
            </div>
          )}

          {/* Phone Number Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-semibold">Caller ID Selection</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose which phone number your AI will call from. Rotating numbers helps avoid spam flags.
            </p>
            
            {outboundPhones.length > 0 ? (
              <>
                <Select value={selectedPhoneId} onValueChange={setSelectedPhoneId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a phone number" />
                  </SelectTrigger>
                  <SelectContent>
                    {outboundPhones.map((phone) => (
                      <SelectItem key={phone.id} value={phone.id}>
                        <div className="flex items-center gap-2">
                          <span>{phone.friendly_name || phone.phone_number}</span>
                          <span className="text-muted-foreground">({phone.phone_number})</span>
                          <Badge variant={phone.calls_today >= phone.daily_limit ? 'destructive' : 'outline'} className="ml-2">
                            {phone.daily_limit - phone.calls_today} left today
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Call Limit Progress */}
                {selectedPhone && (
                  <div className="space-y-2 p-3 rounded-lg border">
                    <div className="flex justify-between text-sm">
                      <span>Daily calls used</span>
                      <span className={limitPercentage >= 90 ? 'text-red-500 font-medium' : ''}>
                        {selectedPhone.calls_today} / {selectedPhone.daily_limit}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          limitPercentage >= 90 ? 'bg-red-500' : 
                          limitPercentage >= 70 ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(limitPercentage, 100)}%` }}
                      />
                    </div>
                    {limitPercentage >= 90 && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Approaching daily limit - consider using another number
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 rounded-lg border border-dashed text-center">
                <Phone className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  No phone numbers assigned yet.
                </p>
                <a 
                  href="/app/settings?tab=phone" 
                  className="text-sm text-primary hover:underline"
                >
                  Add a phone number in Settings →
                </a>
              </div>
            )}
          </div>

          {/* Call Script Type */}
          <div className="space-y-2">
            <Label htmlFor="callScriptType">Call Campaign Type</Label>
            <Select name="callScriptType" defaultValue={config?.outbound_script_type || 'general'}>
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

          {/* Introduction Style */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-semibold">Introduction Style</Label>
            </div>
            <Select 
              name="introductionStyle" 
              defaultValue={
                (config?.schedule as { introductionStyle?: string } | null)?.introductionStyle || 'company_name'
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company_name">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Mention Company Name</span>
                  </div>
                </SelectItem>
                <SelectItem value="service_description">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>Mention What You Do (Service Description)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <p className="text-sm font-medium">Examples:</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="flex items-start gap-2">
                  <Building2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Company Name:</strong> "Hi, this is [Your Company Name] calling..."</span>
                </p>
                <p className="flex items-start gap-2">
                  <Briefcase className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Service Description:</strong> "Hi, I'm calling from a local HVAC company..."</span>
                </p>
              </div>
            </div>
          </div>

          {/* Daily Call Limit */}
          <div className="space-y-2">
            <Label htmlFor="dailyCallLimit">Daily Call Limit</Label>
            <Input
              id="dailyCallLimit"
              name="dailyCallLimit"
              type="number"
              defaultValue={config?.daily_call_limit || 50}
              min="1"
              max="100"
            />
            <p className="text-sm text-muted-foreground">
              Maximum calls per day across all numbers (max 100 to avoid spam flags)
            </p>
          </div>

          {/* Call Schedule Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-semibold">Call Schedule</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Set when your AI can make outbound calls. Avoid calling during busy hours for better answer rates.
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
                    defaultValue={schedule?.startTime || DEFAULT_START_TIME}
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
                    defaultValue={schedule?.endTime || DEFAULT_END_TIME}
                  />
                </div>
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select name="timezone" defaultValue={schedule?.timezone || 'America/New_York'}>
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

          {/* Enable Toggle */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="enableOutbound">Enable Outbound Calling</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, your AI will automatically call leads during scheduled hours
              </p>
            </div>
            <Switch 
              id="enableOutbound" 
              name="enableOutbound" 
              defaultChecked={config?.outbound_enabled}
              disabled={!config?.outbound_agent_id}
            />
          </div>
          
          {!config?.outbound_agent_id && (
            <p className="text-sm text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Outbound calling will be available once your agent is set up by our team
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

