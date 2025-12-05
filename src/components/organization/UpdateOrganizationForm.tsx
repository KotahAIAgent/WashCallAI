'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateOrganization } from '@/lib/organization/actions'
import { useToast } from '@/hooks/use-toast'
import { Database } from '@/types/database'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  Clock,
  Palette,
  Briefcase,
  X,
  Plus
} from 'lucide-react'

type Organization = Database['public']['Tables']['organizations']['Row']

interface BusinessHours {
  [day: string]: {
    open: string
    close: string
    closed: boolean
  }
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

const DEFAULT_SERVICES = [
  'House Washing',
  'Driveway Cleaning',
  'Roof Cleaning',
  'Deck & Patio Cleaning',
  'Fence Cleaning',
  'Gutter Cleaning',
  'Commercial Pressure Washing',
  'Fleet Washing',
  'Graffiti Removal',
  'Concrete Cleaning',
]

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export function UpdateOrganizationForm({ organization }: { organization: Organization }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Parse business hours
  const defaultHours: BusinessHours = {
    monday: { open: '08:00', close: '18:00', closed: false },
    tuesday: { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday: { open: '08:00', close: '18:00', closed: false },
    friday: { open: '08:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '14:00', closed: false },
    sunday: { open: '09:00', close: '14:00', closed: true },
  }
  
  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    (organization.business_hours as BusinessHours) || defaultHours
  )
  const [serviceAreas, setServiceAreas] = useState<string[]>(organization.service_areas || [])
  const [servicesOffered, setServicesOffered] = useState<string[]>(organization.services_offered || [])
  const [newServiceArea, setNewServiceArea] = useState('')
  const [newService, setNewService] = useState('')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.append('organizationId', organization.id)
    formData.append('businessHours', JSON.stringify(businessHours))
    formData.append('serviceAreas', JSON.stringify(serviceAreas))
    formData.append('servicesOffered', JSON.stringify(servicesOffered))
    
    const result = await updateOrganization(formData)
    
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Organization profile updated successfully',
      })
      router.refresh()
    }
    
    setLoading(false)
  }

  function addServiceArea() {
    if (newServiceArea.trim() && !serviceAreas.includes(newServiceArea.trim())) {
      setServiceAreas([...serviceAreas, newServiceArea.trim()])
      setNewServiceArea('')
    }
  }

  function removeServiceArea(area: string) {
    setServiceAreas(serviceAreas.filter(a => a !== area))
  }

  function addService() {
    if (newService.trim() && !servicesOffered.includes(newService.trim())) {
      setServicesOffered([...servicesOffered, newService.trim()])
      setNewService('')
    }
  }

  function removeService(service: string) {
    setServicesOffered(servicesOffered.filter(s => s !== service))
  }

  function toggleService(service: string) {
    if (servicesOffered.includes(service)) {
      setServicesOffered(servicesOffered.filter(s => s !== service))
    } else {
      setServicesOffered([...servicesOffered, service])
    }
  }

  function updateDayHours(day: string, field: 'open' | 'close' | 'closed', value: string | boolean) {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      }
    }))
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {/* Business Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Building2 className="h-5 w-5" />
          Business Information
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={organization.name || ''}
              required
              placeholder="Your Business Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Business Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={organization.email || ''}
              placeholder="contact@yourbusiness.com"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Business Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={organization.phone || ''}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={organization.website || ''}
              placeholder="https://yourbusiness.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Business Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={organization.description || ''}
            placeholder="Tell potential customers about your business..."
            rows={3}
          />
        </div>
      </div>

      <Separator />

      {/* Address */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <MapPin className="h-5 w-5" />
          Business Address
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={organization.address || ''}
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              defaultValue={organization.city || ''}
              placeholder="City"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select name="state" defaultValue={organization.state || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip_code">ZIP Code</Label>
            <Input
              id="zip_code"
              name="zip_code"
              defaultValue={organization.zip_code || ''}
              placeholder="12345"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select name="timezone" defaultValue={organization.timezone || 'America/New_York'}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(tz => (
                <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Service Areas */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Globe className="h-5 w-5" />
          Service Areas
        </div>
        <p className="text-sm text-muted-foreground">
          Add cities, neighborhoods, or areas where you provide services
        </p>

        <div className="flex flex-wrap gap-2">
          {serviceAreas.map(area => (
            <Badge key={area} variant="secondary" className="pl-3 pr-1 py-1.5">
              {area}
              <button
                type="button"
                onClick={() => removeServiceArea(area)}
                className="ml-2 hover:bg-muted rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newServiceArea}
            onChange={(e) => setNewServiceArea(e.target.value)}
            placeholder="Add a service area (e.g., Downtown Houston)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addServiceArea()
              }
            }}
            className="max-w-sm"
          />
          <Button type="button" variant="outline" onClick={addServiceArea}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Services Offered */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Briefcase className="h-5 w-5" />
          Services Offered
        </div>
        <p className="text-sm text-muted-foreground">
          Select the services your business provides
        </p>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DEFAULT_SERVICES.map(service => (
            <label
              key={service}
              className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                servicesOffered.includes(service)
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              }`}
            >
              <input
                type="checkbox"
                checked={servicesOffered.includes(service)}
                onChange={() => toggleService(service)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                servicesOffered.includes(service) ? 'bg-primary border-primary' : 'border-input'
              }`}>
                {servicesOffered.includes(service) && (
                  <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-sm">{service}</span>
            </label>
          ))}
        </div>

        {/* Custom services */}
        {servicesOffered.filter(s => !DEFAULT_SERVICES.includes(s)).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {servicesOffered.filter(s => !DEFAULT_SERVICES.includes(s)).map(service => (
              <Badge key={service} variant="secondary" className="pl-3 pr-1 py-1.5">
                {service}
                <button
                  type="button"
                  onClick={() => removeService(service)}
                  className="ml-2 hover:bg-muted rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            placeholder="Add custom service"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addService()
              }
            }}
            className="max-w-sm"
          />
          <Button type="button" variant="outline" onClick={addService}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Business Hours */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="h-5 w-5" />
          Business Hours
        </div>

        <div className="space-y-3">
          {DAYS.map(day => (
            <div key={day} className="flex items-center gap-4 py-2">
              <div className="w-24 capitalize font-medium">{day}</div>
              <Switch
                checked={!businessHours[day]?.closed}
                onCheckedChange={(checked) => updateDayHours(day, 'closed', !checked)}
              />
              {!businessHours[day]?.closed ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={businessHours[day]?.open || '08:00'}
                    onChange={(e) => updateDayHours(day, 'open', e.target.value)}
                    className="w-28"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={businessHours[day]?.close || '18:00'}
                    onChange={(e) => updateDayHours(day, 'close', e.target.value)}
                    className="w-28"
                  />
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Branding */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Palette className="h-5 w-5" />
          Branding
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              name="logo_url"
              type="url"
              defaultValue={organization.logo_url || ''}
              placeholder="https://yourbusiness.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Enter a URL to your company logo
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="primary_color">Brand Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                name="primary_color"
                type="color"
                defaultValue={organization.primary_color || '#3B82F6'}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                defaultValue={organization.primary_color || '#3B82F6'}
                placeholder="#3B82F6"
                className="flex-1"
                onChange={(e) => {
                  const colorInput = document.getElementById('primary_color') as HTMLInputElement
                  if (colorInput && /^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    colorInput.value = e.target.value
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading} size="lg">
          {loading ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </form>
  )
}
