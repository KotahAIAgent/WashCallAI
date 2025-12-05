'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Check, X, AlertCircle } from 'lucide-react'
import { updateBusinessPreferences } from '@/lib/organization/actions'
import { Json } from '@/types/database'

const SERVICES = [
  'House/Exterior Washing',
  'Driveway & Concrete Cleaning',
  'Roof Cleaning (Soft Wash)',
  'Deck & Patio Cleaning',
  'Fence Cleaning',
  'Gutter Cleaning',
  'Window Cleaning',
  'Commercial Building Washing',
  'Fleet/Vehicle Washing',
  'Grease Trap Cleaning',
  'Restaurant Cleaning',
  'Parking Lot/Garage Cleaning',
  'Graffiti Removal',
  'Pool Deck Cleaning',
  'Awning Cleaning',
]

interface Props {
  organizationId: string
  onboardingData: Json | null
  currentServices: string[] | null
}

export function BusinessPreferencesForm({ organizationId, onboardingData, currentServices }: Props) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Parse existing data
  const existingData = onboardingData as Record<string, unknown> | null
  
  const [serviceTypes, setServiceTypes] = useState<string[]>(
    (existingData?.serviceTypes as string[]) || []
  )
  const [servicesOffered, setServicesOffered] = useState<string[]>(
    currentServices || (existingData?.servicesOffered as string[]) || []
  )
  const [biggestChallenge, setBiggestChallenge] = useState(
    (existingData?.biggestChallenge as string) || ''
  )
  const [callStyle, setCallStyle] = useState(
    (existingData?.callStyle as string) || ''
  )
  const [primaryGoal, setPrimaryGoal] = useState(
    (existingData?.primaryGoal as string) || ''
  )
  const [additionalNotes, setAdditionalNotes] = useState(
    (existingData?.additionalNotes as string) || ''
  )

  function toggleServiceType(type: string) {
    if (serviceTypes.includes(type)) {
      setServiceTypes(serviceTypes.filter(t => t !== type))
    } else {
      setServiceTypes([...serviceTypes, type])
    }
  }

  function toggleService(service: string) {
    if (servicesOffered.includes(service)) {
      setServicesOffered(servicesOffered.filter(s => s !== service))
    } else {
      setServicesOffered([...servicesOffered, service])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await updateBusinessPreferences(organizationId, {
      serviceTypes,
      servicesOffered,
      biggestChallenge,
      callStyle,
      primaryGoal,
      additionalNotes,
    })

    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Preferences Updated',
        description: 'Your business preferences have been saved. Changes will reflect in your AI agent.',
      })
      router.refresh()
    }

    setLoading(false)
  }

  const hasChanges = true // For simplicity, always enable save

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900">These settings affect your AI agent</p>
          <p className="text-blue-700">
            When you update these preferences, we'll adjust your AI agent's behavior to match. 
            Major changes may require manual review by our team.
          </p>
        </div>
      </div>

      {/* Customer Types */}
      <div className="space-y-3">
        <Label>Type of Customers</Label>
        <div className="flex flex-wrap gap-2">
          {['Residential', 'Commercial', 'Both'].map(type => (
            <Badge
              key={type}
              variant={serviceTypes.includes(type.toLowerCase()) ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
              onClick={() => toggleServiceType(type.toLowerCase())}
            >
              {serviceTypes.includes(type.toLowerCase()) && <Check className="h-3 w-3 mr-1" />}
              {type}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Changing from Residential to Commercial (or vice versa) will update how your AI handles calls.
        </p>
      </div>

      {/* Services Offered */}
      <div className="space-y-3">
        <Label>Services You Offer</Label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-64 overflow-y-auto p-1">
          {SERVICES.map(service => (
            <label
              key={service}
              className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                servicesOffered.includes(service)
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={servicesOffered.includes(service)}
                onChange={() => toggleService(service)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                servicesOffered.includes(service) ? 'bg-primary border-primary' : 'border-gray-300'
              }`}>
                {servicesOffered.includes(service) && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm">{service}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Biggest Challenge */}
      <div className="space-y-2">
        <Label>Your Biggest Challenge</Label>
        <Select value={biggestChallenge} onValueChange={setBiggestChallenge}>
          <SelectTrigger>
            <SelectValue placeholder="What's your main challenge?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="getting-leads">Getting enough leads</SelectItem>
            <SelectItem value="answering-calls">Missing calls / can't answer while working</SelectItem>
            <SelectItem value="following-up">Following up with leads</SelectItem>
            <SelectItem value="closing">Converting leads to customers</SelectItem>
            <SelectItem value="pricing">Pricing / quoting jobs</SelectItem>
            <SelectItem value="scheduling">Scheduling efficiently</SelectItem>
            <SelectItem value="hiring">Finding good employees</SelectItem>
            <SelectItem value="marketing">Marketing effectively</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* AI Style */}
      <div className="space-y-2">
        <Label>AI Personality</Label>
        <Select value={callStyle} onValueChange={setCallStyle}>
          <SelectTrigger>
            <SelectValue placeholder="How should your AI sound?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional & Formal</SelectItem>
            <SelectItem value="friendly">Friendly & Casual</SelectItem>
            <SelectItem value="energetic">Energetic & Enthusiastic</SelectItem>
            <SelectItem value="calm">Calm & Reassuring</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Primary Goal */}
      <div className="space-y-2">
        <Label>What's Most Important to You?</Label>
        <Select value={primaryGoal} onValueChange={setPrimaryGoal}>
          <SelectTrigger>
            <SelectValue placeholder="Select your priority..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never-miss">Never miss a call (24/7 availability)</SelectItem>
            <SelectItem value="book-appointments">Book appointments automatically</SelectItem>
            <SelectItem value="qualify-leads">Qualify leads before I call back</SelectItem>
            <SelectItem value="save-time">Save time answering basic questions</SelectItem>
            <SelectItem value="outbound">Proactively reach out to new leads</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label>Additional Notes for AI</Label>
        <Textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Any special instructions, things to mention, or things to avoid..."
          rows={3}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </form>
  )
}

