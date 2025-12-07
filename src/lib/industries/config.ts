import {
  Thermometer,
  Droplets,
  Leaf,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'

export type IndustrySlug = 'hvac' | 'plumbing' | 'landscaping' | 'pressure-washing' | 'dental'

export interface IndustryPricing {
  starter: number
  growth: number
  pro: number
}

export interface IndustryTestimonial {
  quote: string
  name: string
  title: string
  location: string
}

export interface IndustryFAQ {
  question: string
  answer: string
}

export interface IndustryConfig {
  name: string
  slug: IndustrySlug
  icon: string
  iconComponent: LucideIcon
  color: string
  bgColor: string
  tagline: string
  heroTitle: string
  heroDescription: string
  description: string
  pricing: IndustryPricing
  painPoints: string[]
  inboundUseCases: {
    icon: string
    title: string
    description: string
  }[]
  outboundUseCases: {
    icon: string
    title: string
    description: string
  }[]
  testimonials: IndustryTestimonial[]
  faq: IndustryFAQ[]
  outboundTargets: string[]
  avgJobValue: string
  emergencyService: boolean
}

export const industries: Record<IndustrySlug, IndustryConfig> = {
  hvac: {
    name: 'HVAC',
    slug: 'hvac',
    icon: 'Thermometer',
    iconComponent: Thermometer,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    tagline: 'Never miss an emergency call again',
    heroTitle: 'AI Receptionist for HVAC Companies',
    heroDescription: 'Answer emergency calls 24/7, book service appointments, and follow up with maintenance reminders automatically.',
    description: 'AI-powered call answering for heating and cooling companies',
    pricing: {
      starter: 199,
      growth: 449,
      pro: 899,
    },
    painPoints: [
      'Missing emergency calls during installations',
      'Losing customers to competitors who answer faster',
      'No time to follow up with maintenance reminders',
      'After-hours calls going to voicemail',
      'Overwhelmed office staff during peak seasons',
    ],
    inboundUseCases: [
      {
        icon: 'Phone',
        title: '24/7 Emergency Response',
        description: 'AI answers AC breakdowns and furnace emergencies instantly, day or night',
      },
      {
        icon: 'Calendar',
        title: 'Service Scheduling',
        description: 'Book tune-ups, repairs, and installations directly to your calendar',
      },
      {
        icon: 'Users',
        title: 'Lead Qualification',
        description: 'Capture service type, equipment details, and urgency level',
      },
      {
        icon: 'MessageSquare',
        title: 'Instant Alerts',
        description: 'Get SMS notifications for emergency calls requiring immediate attention',
      },
    ],
    outboundUseCases: [
      {
        icon: 'Calendar',
        title: 'Maintenance Reminders',
        description: 'Automatically call customers for seasonal tune-ups and filter changes',
      },
      {
        icon: 'Users',
        title: 'Equipment Upgrade Campaigns',
        description: 'Reach out to customers with aging systems about replacement options',
      },
      {
        icon: 'Phone',
        title: 'Estimate Follow-ups',
        description: 'Follow up on quotes that haven\'t been accepted yet',
      },
      {
        icon: 'Zap',
        title: 'Warranty Expiration',
        description: 'Contact customers whose warranty is expiring to offer service plans',
      },
    ],
    testimonials: [
      {
        quote: "We used to miss 30% of after-hours calls. Now every emergency gets answered instantly. Our emergency revenue is up 40%.",
        name: "Mike Rodriguez",
        title: "Cool Comfort HVAC",
        location: "Phoenix, AZ",
      },
      {
        quote: "The AI schedules maintenance appointments while we're out on jobs. It's like having a full-time receptionist for a fraction of the cost.",
        name: "Sarah Chen",
        title: "Premier Climate Control",
        location: "Dallas, TX",
      },
      {
        quote: "Our seasonal tune-up campaigns used to take us weeks of calling. Now the AI handles it automatically and we've doubled our bookings.",
        name: "Tom Williams",
        title: "Williams Heating & Air",
        location: "Denver, CO",
      },
    ],
    faq: [
      {
        question: "Can the AI handle emergency vs non-emergency calls differently?",
        answer: "Yes! The AI is trained to identify emergency situations (no heat in winter, AC out in summer) and prioritize those with immediate SMS alerts to your on-call technician.",
      },
      {
        question: "Does it work with my scheduling software?",
        answer: "NeverMiss AI integrates with popular HVAC scheduling tools like ServiceTitan, Housecall Pro, and Jobber. We can also work with Google Calendar for simpler setups.",
      },
      {
        question: "Can the AI give pricing estimates?",
        answer: "You can configure the AI with your standard service rates. It can provide ballpark estimates and explain that final pricing depends on the specific situation.",
      },
    ],
    outboundTargets: [
      'Past customers due for maintenance',
      'Homeowners with systems 10+ years old',
      'New homeowners in your service area',
      'Commercial property managers',
    ],
    avgJobValue: '$450 - $8,000',
    emergencyService: true,
  },

  plumbing: {
    name: 'Plumbing',
    slug: 'plumbing',
    icon: 'Droplets',
    iconComponent: Droplets,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    tagline: 'Every emergency answered, every lead captured',
    heroTitle: 'AI Receptionist for Plumbers',
    heroDescription: 'Answer emergency calls 24/7, schedule service appointments, and never lose a lead to voicemail again.',
    description: 'AI-powered call answering for plumbing companies',
    pricing: {
      starter: 149,
      growth: 349,
      pro: 699,
    },
    painPoints: [
      'Missing emergency calls while under a sink',
      'Losing leads to competitors who answer first',
      'No time to return calls until evening',
      'Weekend and holiday calls going unanswered',
      'Difficulty qualifying leads before driving out',
    ],
    inboundUseCases: [
      {
        icon: 'Phone',
        title: '24/7 Emergency Dispatch',
        description: 'AI handles burst pipes, flooding, and sewer backups any time of day',
      },
      {
        icon: 'Calendar',
        title: 'Appointment Booking',
        description: 'Schedule drain cleaning, water heater service, and repairs automatically',
      },
      {
        icon: 'Users',
        title: 'Lead Qualification',
        description: 'Gather problem details, property type, and urgency before you arrive',
      },
      {
        icon: 'MessageSquare',
        title: 'Emergency Alerts',
        description: 'Instant SMS for water emergencies requiring immediate response',
      },
    ],
    outboundUseCases: [
      {
        icon: 'Calendar',
        title: 'Water Heater Maintenance',
        description: 'Remind customers about annual flushes and anode rod replacements',
      },
      {
        icon: 'Users',
        title: 'Re-pipe Campaigns',
        description: 'Target homes with aging galvanized or polybutylene pipes',
      },
      {
        icon: 'Phone',
        title: 'Estimate Follow-ups',
        description: 'Automatically follow up on quotes for larger jobs',
      },
      {
        icon: 'Zap',
        title: 'Seasonal Prep',
        description: 'Winter pipe insulation and summer irrigation check campaigns',
      },
    ],
    testimonials: [
      {
        quote: "I used to lose 5-10 calls a day while on jobs. Now I never miss a single one, and my emergency revenue has tripled.",
        name: "Dave Martinez",
        title: "Martinez Plumbing",
        location: "Houston, TX",
      },
      {
        quote: "The AI qualifies leads so well, I know exactly what I'm walking into. No more wasted trips for jobs I can't handle.",
        name: "Jennifer Walsh",
        title: "Priority Plumbing Services",
        location: "Atlanta, GA",
      },
      {
        quote: "Our water heater maintenance campaigns bring in consistent revenue during slow months. The AI does all the calling for us.",
        name: "Robert Kim",
        title: "Kim's Plumbing & Heating",
        location: "Seattle, WA",
      },
    ],
    faq: [
      {
        question: "How does the AI handle true emergencies?",
        answer: "The AI identifies emergencies like active leaks, flooding, or sewer backups and immediately sends you an SMS alert with the customer's details and callback number.",
      },
      {
        question: "Can it gather details about the plumbing issue?",
        answer: "Yes! The AI asks relevant questions to understand the problem - is it a leak or clog, where is it located, is there water damage, type of property, etc.",
      },
      {
        question: "Does it work on weekends and holidays?",
        answer: "Absolutely. The AI answers 24/7/365, which is perfect for plumbing emergencies that don't wait for business hours.",
      },
    ],
    outboundTargets: [
      'Past customers due for water heater service',
      'Homeowners with older homes (pre-1990)',
      'Property management companies',
      'Restaurant and commercial kitchens',
    ],
    avgJobValue: '$200 - $3,500',
    emergencyService: true,
  },

  landscaping: {
    name: 'Landscaping',
    slug: 'landscaping',
    icon: 'Leaf',
    iconComponent: Leaf,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    tagline: 'Grow your business while you grow their lawns',
    heroTitle: 'AI Receptionist for Landscapers',
    heroDescription: 'Answer calls while you\'re on the mower, book estimates automatically, and keep customers coming back season after season.',
    description: 'AI-powered call answering for landscaping and lawn care companies',
    pricing: {
      starter: 129,
      growth: 299,
      pro: 599,
    },
    painPoints: [
      'Missing calls while operating equipment',
      'Forgetting to return calls at end of long days',
      'Losing new customers to competitors',
      'Difficulty managing seasonal demand spikes',
      'No time to upsell existing customers',
    ],
    inboundUseCases: [
      {
        icon: 'Phone',
        title: 'Always-On Answering',
        description: 'Never miss a call while mowing, trimming, or on the job site',
      },
      {
        icon: 'Calendar',
        title: 'Estimate Scheduling',
        description: 'Book lawn care quotes and landscape consultations automatically',
      },
      {
        icon: 'Users',
        title: 'Service Inquiries',
        description: 'Handle questions about services, pricing, and availability',
      },
      {
        icon: 'MessageSquare',
        title: 'New Lead Alerts',
        description: 'Get notified instantly when a new potential customer calls',
      },
    ],
    outboundUseCases: [
      {
        icon: 'Calendar',
        title: 'Seasonal Activation',
        description: 'Call dormant customers when spring arrives to restart service',
      },
      {
        icon: 'Users',
        title: 'Service Upsells',
        description: 'Offer aeration, overseeding, and fertilization to existing customers',
      },
      {
        icon: 'Phone',
        title: 'Fall Cleanup Campaigns',
        description: 'Reach out about leaf removal and winterization services',
      },
      {
        icon: 'Zap',
        title: 'Irrigation Startups',
        description: 'Contact customers about spring irrigation system activation',
      },
    ],
    testimonials: [
      {
        quote: "I went from missing half my calls to capturing every single lead. My customer base has grown 60% in one season.",
        name: "Carlos Mendez",
        title: "Green Valley Landscaping",
        location: "Austin, TX",
      },
      {
        quote: "The spring reactivation campaign brought back 80% of last year's customers automatically. That used to take me two weeks of calling.",
        name: "Amanda Foster",
        title: "Foster's Lawn & Garden",
        location: "Charlotte, NC",
      },
      {
        quote: "Finally, I can focus on the work instead of worrying about missing calls. The AI handles everything professionally.",
        name: "James O'Brien",
        title: "Emerald Lawn Care",
        location: "Portland, OR",
      },
    ],
    faq: [
      {
        question: "Can the AI give quotes over the phone?",
        answer: "The AI can provide general pricing ranges you configure and schedule an in-person estimate for accurate quotes. This pre-qualifies leads before you drive out.",
      },
      {
        question: "How does seasonal campaign calling work?",
        answer: "You upload your customer list and set the campaign schedule. The AI calls customers during appropriate hours, leaves voicemails if needed, and reports back who's interested.",
      },
      {
        question: "Does it work for both residential and commercial?",
        answer: "Yes! The AI can be configured to handle both residential homeowners and commercial property managers with appropriate scripts for each.",
      },
    ],
    outboundTargets: [
      'Past customers who haven\'t booked this season',
      'Homeowners in affluent neighborhoods',
      'Property management companies',
      'HOAs and apartment complexes',
    ],
    avgJobValue: '$50 - $500/month recurring',
    emergencyService: false,
  },

  'pressure-washing': {
    name: 'Pressure Washing',
    slug: 'pressure-washing',
    icon: 'Sparkles',
    iconComponent: Sparkles,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    tagline: 'Clean up your schedule while cleaning their properties',
    heroTitle: 'AI Receptionist for Pressure Washing',
    heroDescription: 'Answer every call while you\'re on the job, book estimates automatically, and grow your customer base effortlessly.',
    description: 'AI-powered call answering for pressure washing businesses',
    pricing: {
      starter: 149,
      growth: 349,
      pro: 699,
    },
    painPoints: [
      'Missing calls while operating equipment',
      'Customers hanging up on voicemail',
      'No time to call back leads',
      'Competitors answering faster and winning jobs',
      'Inconsistent follow-up with past customers',
    ],
    inboundUseCases: [
      {
        icon: 'Phone',
        title: 'Never Miss a Call',
        description: 'AI answers instantly while you\'re power washing driveways or houses',
      },
      {
        icon: 'Calendar',
        title: 'Instant Booking',
        description: 'Schedule estimates and jobs directly to your calendar',
      },
      {
        icon: 'Users',
        title: 'Lead Capture',
        description: 'Capture property details, service type, and contact information',
      },
      {
        icon: 'MessageSquare',
        title: 'Hot Lead Alerts',
        description: 'SMS notifications for high-value commercial opportunities',
      },
    ],
    outboundUseCases: [
      {
        icon: 'Calendar',
        title: 'Annual Reminders',
        description: 'Call past customers when it\'s time for their yearly cleaning',
      },
      {
        icon: 'Users',
        title: 'Restaurant Outreach',
        description: 'Cold call restaurants about dumpster pad and drive-thru cleaning',
      },
      {
        icon: 'Phone',
        title: 'Property Managers',
        description: 'Reach out to property managers about building maintenance',
      },
      {
        icon: 'Zap',
        title: 'Estimate Follow-ups',
        description: 'Follow up on quotes that haven\'t been accepted',
      },
    ],
    testimonials: [
      {
        quote: "I used to miss 5-10 calls a day while on jobs. Now I never miss a single one. My leads have doubled!",
        name: "Mike Johnson",
        title: "Clean Pro Pressure Washing",
        location: "Houston, TX",
      },
      {
        quote: "The AI sounds so natural, customers don't even know they're talking to a robot. It's incredible.",
        name: "Sarah Williams",
        title: "Sparkle Clean Services",
        location: "Phoenix, AZ",
      },
      {
        quote: "Setup was a breeze. Within 48 hours I had an AI answering my calls and booking estimates.",
        name: "David Chen",
        title: "Premier Power Wash",
        location: "Dallas, TX",
      },
    ],
    faq: [
      {
        question: "What happens if I miss a call?",
        answer: "You won't! Our AI receptionist answers every call instantly, 24/7/365. Even after hours, weekends, and holidays. Every lead is captured automatically.",
      },
      {
        question: "How natural does the AI sound?",
        answer: "Extremely natural. Our AI uses advanced voice technology that sounds like a real human. Most callers don't realize they're speaking with AI.",
      },
      {
        question: "Can I customize what the AI says?",
        answer: "Absolutely. We customize your AI with your business name, services, pricing, and service areas. You can also set up specific scripts for different situations.",
      },
    ],
    outboundTargets: [
      'Past customers due for annual cleaning',
      'Restaurants and commercial kitchens',
      'Property management companies',
      'Gas stations and convenience stores',
    ],
    avgJobValue: '$200 - $800',
    emergencyService: false,
  },

  dental: {
    name: 'Dental',
    slug: 'dental',
    icon: 'Stethoscope',
    iconComponent: Stethoscope,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    tagline: 'Fill your chairs, not your voicemail',
    heroTitle: 'AI Receptionist for Dental Practices',
    heroDescription: 'Answer patient calls 24/7, reduce no-shows with automated reminders, and fill your schedule with new patients.',
    description: 'AI-powered call answering for dental practices',
    pricing: {
      starter: 249,
      growth: 549,
      pro: 999,
    },
    painPoints: [
      'Front desk overwhelmed with calls',
      'Missing calls during lunch and after hours',
      'High patient no-show rates',
      'Difficulty reactivating dormant patients',
      'No time for recall campaigns',
    ],
    inboundUseCases: [
      {
        icon: 'Phone',
        title: 'After-Hours Answering',
        description: 'Capture new patient inquiries when your office is closed',
      },
      {
        icon: 'Calendar',
        title: 'Appointment Scheduling',
        description: 'Book cleanings, consultations, and procedures automatically',
      },
      {
        icon: 'Users',
        title: 'New Patient Intake',
        description: 'Gather insurance info, dental history, and contact details',
      },
      {
        icon: 'MessageSquare',
        title: 'Emergency Triage',
        description: 'Identify dental emergencies and route appropriately',
      },
    ],
    outboundUseCases: [
      {
        icon: 'Calendar',
        title: 'Recall Campaigns',
        description: 'Automatically call patients due for their 6-month cleaning',
      },
      {
        icon: 'Users',
        title: 'Reactivation Campaigns',
        description: 'Reach out to patients who haven\'t visited in 12+ months',
      },
      {
        icon: 'Phone',
        title: 'Appointment Reminders',
        description: 'Reduce no-shows with automated confirmation calls',
      },
      {
        icon: 'Zap',
        title: 'Treatment Follow-ups',
        description: 'Follow up on treatment plans that haven\'t been scheduled',
      },
    ],
    testimonials: [
      {
        quote: "Our no-show rate dropped from 15% to 3% with the automated reminder calls. That's thousands in recovered revenue.",
        name: "Dr. Lisa Park",
        title: "Bright Smile Dental",
        location: "San Diego, CA",
      },
      {
        quote: "We reactivated 200 dormant patients in the first month. The ROI was immediate and substantial.",
        name: "Dr. James Morrison",
        title: "Morrison Family Dentistry",
        location: "Nashville, TN",
      },
      {
        quote: "My front desk used to be overwhelmed with calls. Now they can focus on patients in the office while the AI handles the phones.",
        name: "Dr. Rachel Chen",
        title: "Gentle Care Dental",
        location: "Chicago, IL",
      },
    ],
    faq: [
      {
        question: "Is this HIPAA compliant?",
        answer: "Yes. NeverMiss AI is designed with healthcare practices in mind. We follow HIPAA guidelines for handling patient information and can sign a BAA.",
      },
      {
        question: "Can it integrate with my practice management software?",
        answer: "We integrate with popular dental software including Dentrix, Eaglesoft, Open Dental, and others. Custom integrations are available on Pro plans.",
      },
      {
        question: "How does the recall campaign work?",
        answer: "You export your patient list with their last visit dates. The AI calls patients due for cleanings, schedules appointments, and reports results back to your dashboard.",
      },
    ],
    outboundTargets: [
      'Patients due for 6-month cleanings',
      'Patients who haven\'t visited in 12+ months',
      'Patients with unscheduled treatment plans',
      'New movers in your area',
    ],
    avgJobValue: '$150 - $3,000',
    emergencyService: true,
  },
}

// Helper functions
export function getIndustryBySlug(slug: string): IndustryConfig | undefined {
  return industries[slug as IndustrySlug]
}

export function getAllIndustries(): IndustryConfig[] {
  return Object.values(industries)
}

export function getIndustrySlugs(): IndustrySlug[] {
  return Object.keys(industries) as IndustrySlug[]
}

// Default industry for fallback
export const defaultIndustry = industries['pressure-washing']

