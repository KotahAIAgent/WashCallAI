'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  Users, 
  Truck, 
  MapPin, 
  Target,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  X
} from 'lucide-react'
import { submitOnboardingForm } from '@/lib/onboarding/actions'

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

const EQUIPMENT = [
  'Hot Water Pressure Washer',
  'Cold Water Pressure Washer',
  'Soft Wash System',
  'Surface Cleaner',
  'Water Tank/Trailer',
  'Lift/Boom Equipment',
  'Commercial Grade Equipment',
]

const MARKETING_CHANNELS = [
  'Google Ads',
  'Facebook/Instagram Ads',
  'Door-to-Door',
  'Yard Signs',
  'Referrals Only',
  'Nextdoor',
  'HomeAdvisor/Thumbtack',
  'Website/SEO',
  'Direct Mail',
  'None Currently',
]

interface FormData {
  // Business Basics
  businessName: string
  ownerName: string
  email: string
  phone: string
  website: string
  yearsInBusiness: string
  
  // Service Details
  serviceTypes: string[] // residential, commercial, both
  servicesOffered: string[]
  equipmentOwned: string[]
  crewSize: string
  
  // Service Area
  city: string
  state: string
  serviceRadius: string
  specificAreas: string
  
  // Business Goals
  averageJobValue: string
  monthlyRevenue: string
  desiredMonthlyRevenue: string
  biggestChallenge: string
  
  // Current Marketing
  currentMarketing: string[]
  monthlyMarketingBudget: string
  leadsPerMonth: string
  conversionRate: string
  
  // AI Preferences
  callStyle: string
  primaryGoal: string
  additionalNotes: string
}

const initialFormData: FormData = {
  businessName: '',
  ownerName: '',
  email: '',
  phone: '',
  website: '',
  yearsInBusiness: '',
  serviceTypes: [],
  servicesOffered: [],
  equipmentOwned: [],
  crewSize: '',
  city: '',
  state: '',
  serviceRadius: '',
  specificAreas: '',
  averageJobValue: '',
  monthlyRevenue: '',
  desiredMonthlyRevenue: '',
  biggestChallenge: '',
  currentMarketing: [],
  monthlyMarketingBudget: '',
  leadsPerMonth: '',
  conversionRate: '',
  callStyle: '',
  primaryGoal: '',
  additionalNotes: '',
}

const STEPS = [
  { title: 'Business Info', icon: Building2 },
  { title: 'Services', icon: Truck },
  { title: 'Service Area', icon: MapPin },
  { title: 'Goals', icon: Target },
  { title: 'Marketing', icon: Users },
  { title: 'AI Setup', icon: Sparkles },
]

export function OnboardingForm({ organizationId }: { organizationId: string }) {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  function updateField(field: keyof FormData, value: string | string[]) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function toggleArrayField(field: keyof FormData, value: string) {
    const current = formData[field] as string[]
    if (current.includes(value)) {
      updateField(field, current.filter(v => v !== value))
    } else {
      updateField(field, [...current, value])
    }
  }

  async function handleSubmit() {
    setLoading(true)
    
    const result = await submitOnboardingForm(organizationId, formData)
    
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Application Submitted!',
        description: 'We\'ll review your info and get your AI agent set up. Check your email!',
      })
      router.push('/app/pricing')
      router.refresh()
    }
    
    setLoading(false)
  }

  function nextStep() {
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  function prevStep() {
    if (step > 0) setStep(step - 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Let's Set Up Your AI Calling Agent</h1>
          <p className="text-gray-600 mt-2">
            Tell us about your pressure washing business so we can customize your AI agent
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    i < step 
                      ? 'bg-green-500 text-white' 
                      : i === step 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i < step ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${i === step ? 'font-medium' : 'text-gray-500'}`}>
                  {s.title}
                </span>
              </div>
            )
          })}
        </div>

        {/* Form Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const Icon = STEPS[step].icon
                return <Icon className="h-5 w-5" />
              })()}
              {STEPS[step].title}
            </CardTitle>
            <CardDescription>
              {step === 0 && 'Basic information about your business'}
              {step === 1 && 'What services do you offer?'}
              {step === 2 && 'Where do you operate?'}
              {step === 3 && 'Your business goals and challenges'}
              {step === 4 && 'How you currently get customers'}
              {step === 5 && 'Customize your AI calling experience'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Step 0: Business Basics */}
            {step === 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => updateField('businessName', e.target.value)}
                      placeholder="Clean Pro Pressure Washing"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Your Name *</Label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) => updateField('ownerName', e.target.value)}
                      placeholder="John Smith"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Business Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="john@cleanpro.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Business Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website (optional)</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://cleanpro.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsInBusiness">Years in Business</Label>
                    <Select value={formData.yearsInBusiness} onValueChange={(v) => updateField('yearsInBusiness', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Just starting</SelectItem>
                        <SelectItem value="1-2">1-2 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="5-10">5-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Step 1: Services */}
            {step === 1 && (
              <>
                <div className="space-y-4">
                  <Label>Type of Customers *</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Residential', 'Commercial', 'Both'].map(type => (
                      <Badge
                        key={type}
                        variant={formData.serviceTypes.includes(type.toLowerCase()) ? 'default' : 'outline'}
                        className="cursor-pointer px-4 py-2"
                        onClick={() => toggleArrayField('serviceTypes', type.toLowerCase())}
                      >
                        {formData.serviceTypes.includes(type.toLowerCase()) && <Check className="h-3 w-3 mr-1" />}
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Services You Offer *</Label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {SERVICES.map(service => (
                      <label
                        key={service}
                        className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                          formData.servicesOffered.includes(service)
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.servicesOffered.includes(service)}
                          onChange={() => toggleArrayField('servicesOffered', service)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          formData.servicesOffered.includes(service) ? 'bg-primary border-primary' : 'border-gray-300'
                        }`}>
                          {formData.servicesOffered.includes(service) && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-sm">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="crewSize">Crew Size</Label>
                    <Select value={formData.crewSize} onValueChange={(v) => updateField('crewSize', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Just me</SelectItem>
                        <SelectItem value="2-3">2-3 people</SelectItem>
                        <SelectItem value="4-6">4-6 people</SelectItem>
                        <SelectItem value="7+">7+ people</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Equipment You Own</Label>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENT.map(eq => (
                      <Badge
                        key={eq}
                        variant={formData.equipmentOwned.includes(eq) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayField('equipmentOwned', eq)}
                      >
                        {formData.equipmentOwned.includes(eq) && <Check className="h-3 w-3 mr-1" />}
                        {eq}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Service Area */}
            {step === 2 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">Primary City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Houston"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      placeholder="TX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceRadius">How far will you travel?</Label>
                  <Select value={formData.serviceRadius} onValueChange={(v) => updateField('serviceRadius', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select radius..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">Up to 10 miles</SelectItem>
                      <SelectItem value="25">Up to 25 miles</SelectItem>
                      <SelectItem value="50">Up to 50 miles</SelectItem>
                      <SelectItem value="100">Up to 100 miles</SelectItem>
                      <SelectItem value="statewide">Statewide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specificAreas">Specific Areas/Neighborhoods You Serve</Label>
                  <Textarea
                    id="specificAreas"
                    value={formData.specificAreas}
                    onChange={(e) => updateField('specificAreas', e.target.value)}
                    placeholder="e.g., The Woodlands, Sugar Land, Katy, Memorial..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Step 3: Goals */}
            {step === 3 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="averageJobValue">Average Job Value</Label>
                    <Select value={formData.averageJobValue} onValueChange={(v) => updateField('averageJobValue', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-200">Under $200</SelectItem>
                        <SelectItem value="200-500">$200 - $500</SelectItem>
                        <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                        <SelectItem value="1000-2500">$1,000 - $2,500</SelectItem>
                        <SelectItem value="2500+">$2,500+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRevenue">Current Monthly Revenue</Label>
                    <Select value={formData.monthlyRevenue} onValueChange={(v) => updateField('monthlyRevenue', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-5k">Under $5,000</SelectItem>
                        <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                        <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                        <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                        <SelectItem value="50k+">$50,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desiredMonthlyRevenue">Target Monthly Revenue</Label>
                  <Select value={formData.desiredMonthlyRevenue} onValueChange={(v) => updateField('desiredMonthlyRevenue', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Where do you want to be?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10k">$10,000/month</SelectItem>
                      <SelectItem value="25k">$25,000/month</SelectItem>
                      <SelectItem value="50k">$50,000/month</SelectItem>
                      <SelectItem value="100k">$100,000/month</SelectItem>
                      <SelectItem value="200k+">$200,000+/month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biggestChallenge">What's Your Biggest Challenge?</Label>
                  <Select value={formData.biggestChallenge} onValueChange={(v) => updateField('biggestChallenge', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
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
              </>
            )}

            {/* Step 4: Marketing */}
            {step === 4 && (
              <>
                <div className="space-y-4">
                  <Label>How Do You Currently Get Customers?</Label>
                  <div className="flex flex-wrap gap-2">
                    {MARKETING_CHANNELS.map(channel => (
                      <Badge
                        key={channel}
                        variant={formData.currentMarketing.includes(channel) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayField('currentMarketing', channel)}
                      >
                        {formData.currentMarketing.includes(channel) && <Check className="h-3 w-3 mr-1" />}
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyMarketingBudget">Monthly Marketing Budget</Label>
                    <Select value={formData.monthlyMarketingBudget} onValueChange={(v) => updateField('monthlyMarketingBudget', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">$0 (Word of mouth only)</SelectItem>
                        <SelectItem value="under-500">Under $500</SelectItem>
                        <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                        <SelectItem value="1000-2500">$1,000 - $2,500</SelectItem>
                        <SelectItem value="2500+">$2,500+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leadsPerMonth">Leads Per Month</Label>
                    <Select value={formData.leadsPerMonth} onValueChange={(v) => updateField('leadsPerMonth', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-10">Under 10</SelectItem>
                        <SelectItem value="10-25">10 - 25</SelectItem>
                        <SelectItem value="25-50">25 - 50</SelectItem>
                        <SelectItem value="50-100">50 - 100</SelectItem>
                        <SelectItem value="100+">100+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conversionRate">Estimated Close Rate</Label>
                  <Select value={formData.conversionRate} onValueChange={(v) => updateField('conversionRate', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="How many leads become customers?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-10">Under 10%</SelectItem>
                      <SelectItem value="10-25">10% - 25%</SelectItem>
                      <SelectItem value="25-40">25% - 40%</SelectItem>
                      <SelectItem value="40-60">40% - 60%</SelectItem>
                      <SelectItem value="60+">60%+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 5: AI Setup */}
            {step === 5 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="callStyle">Preferred AI Personality</Label>
                  <Select value={formData.callStyle} onValueChange={(v) => updateField('callStyle', v)}>
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

                <div className="space-y-2">
                  <Label htmlFor="primaryGoal">What's Most Important to You?</Label>
                  <Select value={formData.primaryGoal} onValueChange={(v) => updateField('primaryGoal', v)}>
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

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">Anything else we should know?</Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={(e) => updateField('additionalNotes', e.target.value)}
                    placeholder="Special requests, unique aspects of your business, specific things you want the AI to say or avoid..."
                    rows={4}
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900">What Happens Next?</h4>
                  <ul className="mt-2 space-y-1 text-sm text-blue-800">
                    <li>• We'll review your information within 24 hours</li>
                    <li>• Our team will create a custom AI agent for your business</li>
                    <li>• You'll receive an email when it's ready to test</li>
                    <li>• Choose a plan to go live!</li>
                  </ul>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

