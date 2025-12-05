'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing,
  Calendar,
  MessageSquare,
  Moon,
  Smartphone,
  Plus
} from 'lucide-react'
import { updateNotificationSettings } from '@/lib/organization/actions'
import { Json } from '@/types/database'

interface NotificationSettings {
  smsEnabled: boolean
  notifyOnInbound: boolean
  notifyOnInterestedOutbound: boolean
  notifyOnCallback: boolean
  notifyOnBooked: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

const defaultSettings: NotificationSettings = {
  smsEnabled: false,
  notifyOnInbound: true,
  notifyOnInterestedOutbound: true,
  notifyOnCallback: true,
  notifyOnBooked: true,
  quietHoursEnabled: false,
  quietHoursStart: '21:00',
  quietHoursEnd: '08:00',
}

interface PhoneNumber {
  id: string
  phone_number: string
  friendly_name: string | null
  type: string
}

interface Props {
  organizationId: string
  notificationPhone: string | null
  notificationSettings: Json | null
  phoneNumbers?: PhoneNumber[]
}

export function NotificationSettingsForm({ 
  organizationId, 
  notificationPhone, 
  notificationSettings,
  phoneNumbers = []
}: Props) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  // Parse settings or use defaults
  const parsedSettings = notificationSettings 
    ? { ...defaultSettings, ...(notificationSettings as Record<string, unknown>) }
    : defaultSettings

  const [phoneSource, setPhoneSource] = useState<'select' | 'custom'>(
    notificationPhone && phoneNumbers.some(p => p.phone_number === notificationPhone) 
      ? 'select' 
      : 'custom'
  )
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>(
    phoneNumbers.find(p => p.phone_number === notificationPhone)?.id || ''
  )
  const [customPhone, setCustomPhone] = useState(
    notificationPhone && !phoneNumbers.some(p => p.phone_number === notificationPhone)
      ? notificationPhone
      : ''
  )
  const [settings, setSettings] = useState<NotificationSettings>(parsedSettings as NotificationSettings)

  // Get the actual phone number to save
  const getPhoneToSave = () => {
    if (phoneSource === 'select' && selectedPhoneId) {
      const selected = phoneNumbers.find(p => p.id === selectedPhoneId)
      return selected?.phone_number || ''
    }
    return customPhone
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const phoneToSave = getPhoneToSave()
    const result = await updateNotificationSettings(organizationId, phoneToSave, settings)

    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated.',
      })
      router.refresh()
    }

    setLoading(false)
  }

  function updateSetting<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Master Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <Label htmlFor="smsEnabled" className="text-base font-medium">Enable SMS Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive text alerts for important lead activities
            </p>
          </div>
        </div>
        <Switch
          id="smsEnabled"
          checked={settings.smsEnabled}
          onCheckedChange={(checked) => updateSetting('smsEnabled', checked)}
        />
      </div>

      {settings.smsEnabled && (
        <>
          {/* Phone Number Selection */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Smartphone className="h-4 w-4" />
              Where to send notifications
            </Label>

            {/* Phone source tabs */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={phoneSource === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPhoneSource('select')}
                disabled={phoneNumbers.length === 0}
              >
                <Phone className="h-4 w-4 mr-2" />
                Select from my numbers
              </Button>
              <Button
                type="button"
                variant={phoneSource === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPhoneSource('custom')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Enter custom number
              </Button>
            </div>

            {phoneSource === 'select' ? (
              phoneNumbers.length > 0 ? (
                <div className="space-y-2">
                  <Select value={selectedPhoneId} onValueChange={setSelectedPhoneId}>
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="Select a phone number" />
                    </SelectTrigger>
                    <SelectContent>
                      {phoneNumbers.map(phone => (
                        <SelectItem key={phone.id} value={phone.id}>
                          <div className="flex items-center gap-2">
                            <span>{phone.friendly_name || phone.phone_number}</span>
                            {phone.friendly_name && (
                              <span className="text-muted-foreground text-xs">
                                ({phone.phone_number})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Select one of your configured phone numbers
                  </p>
                </div>
              ) : (
                <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                  <p className="text-sm">No phone numbers configured yet.</p>
                  <p className="text-xs mt-1">Contact your administrator to add phone numbers, or enter a custom number.</p>
                </div>
              )
            ) : (
              <div className="space-y-2">
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="max-w-md"
                />
                <p className="text-sm text-muted-foreground">
                  Enter your personal cell phone or any number where you want to receive alerts
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Notification Types */}
          <div className="space-y-4">
            <h4 className="font-medium">What to notify me about</h4>
            
            {/* Inbound Calls */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <PhoneIncoming className="h-4 w-4 text-green-600" />
                <div>
                  <Label htmlFor="notifyInbound">Inbound Calls</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert me when someone calls in
                  </p>
                </div>
              </div>
              <Switch
                id="notifyInbound"
                checked={settings.notifyOnInbound}
                onCheckedChange={(checked) => updateSetting('notifyOnInbound', checked)}
              />
            </div>

            {/* Interested Outbound */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                <div>
                  <Label htmlFor="notifyInterested">Interested Leads (Outbound)</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert me when outbound calls result in interest
                  </p>
                </div>
              </div>
              <Switch
                id="notifyInterested"
                checked={settings.notifyOnInterestedOutbound}
                onCheckedChange={(checked) => updateSetting('notifyOnInterestedOutbound', checked)}
              />
            </div>

            {/* Callback Requests */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-amber-600" />
                <div>
                  <Label htmlFor="notifyCallback">Callback Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert me when someone requests a callback
                  </p>
                </div>
              </div>
              <Switch
                id="notifyCallback"
                checked={settings.notifyOnCallback}
                onCheckedChange={(checked) => updateSetting('notifyOnCallback', checked)}
              />
            </div>

            {/* Booked Appointments */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-purple-600" />
                <div>
                  <Label htmlFor="notifyBooked">Booked Appointments</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert me when an estimate is scheduled
                  </p>
                </div>
              </div>
              <Switch
                id="notifyBooked"
                checked={settings.notifyOnBooked}
                onCheckedChange={(checked) => updateSetting('notifyOnBooked', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Quiet Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-4 w-4" />
                <div>
                  <Label htmlFor="quietHours">Quiet Hours</Label>
                  <p className="text-sm text-muted-foreground">
                    Pause notifications during specific hours
                  </p>
                </div>
              </div>
              <Switch
                id="quietHours"
                checked={settings.quietHoursEnabled}
                onCheckedChange={(checked) => updateSetting('quietHoursEnabled', checked)}
              />
            </div>

            {settings.quietHoursEnabled && (
              <div className="flex items-center gap-4 pl-7">
                <div className="space-y-1">
                  <Label htmlFor="quietStart" className="text-xs text-muted-foreground">Start</Label>
                  <Input
                    id="quietStart"
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                    className="w-28"
                  />
                </div>
                <span className="text-muted-foreground mt-5">to</span>
                <div className="space-y-1">
                  <Label htmlFor="quietEnd" className="text-xs text-muted-foreground">End</Label>
                  <Input
                    id="quietEnd"
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                    className="w-28"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Notification Settings'}
        </Button>
      </div>
    </form>
  )
}
