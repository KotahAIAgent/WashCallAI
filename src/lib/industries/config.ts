import {
  Thermometer,
  Droplets,
  Leaf,
  Sparkles,
  Stethoscope,
  Key,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export type IndustrySlug = 'hvac' | 'plumbing' | 'landscaping' | 'pressure-washing' | 'dental' | 'locksmith' | 'electrician'

export interface IndustryPricing {
  starter: number
  growth: number
  pro: number
  // Minutes included per month
  starterMinutes: number
  growthMinutes: number
  proMinutes: number
  // Overage rate per minute (after included minutes)
  overageRate: number
  // Average call duration in minutes (for display)
  avgCallDuration: number
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
      starter: 179,
      growth: 399,
      pro: 799,
      starterMinutes: 750,
      growthMinutes: 2000,
      proMinutes: 5000,
      overageRate: 0.20,
      avgCallDuration: 6.5,
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
        answer: "FusionCaller integrates with popular HVAC scheduling tools like ServiceTitan, Housecall Pro, and Jobber. We can also work with Google Calendar for simpler setups.",
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
      starter: 159,
      growth: 379,
      pro: 749,
      starterMinutes: 750,
      growthMinutes: 2000,
      proMinutes: 5000,
      overageRate: 0.20,
      avgCallDuration: 6.5,
    },
    painPoints: [
      'Missing emergency calls while under a sink',
      'Losing leads to competitors who answer first',
      'No time to return calls until evening',
      'Weekend and holiday calls going unanswered',
      'Difficulty qualifying leads before driving out',
      'Can\'t quote diagnostic fees over the phone',
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
      {
        icon: 'DollarSign',
        title: 'Fixed Rate Quoting',
        description: 'Quote diagnostic fees ($75-$150) and service call fees over the phone',
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
        question: "Can it quote diagnostic fees over the phone?",
        answer: "Yes! The AI can quote your standard diagnostic fee ($75-$150) and service call fees immediately. This builds trust and sets expectations before you arrive.",
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
    avgJobValue: '$300 - $3,500',
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
      starter: 119,
      growth: 279,
      pro: 549,
      starterMinutes: 500,
      growthMinutes: 1200,
      proMinutes: 3000,
      overageRate: 0.20,
      avgCallDuration: 5,
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
      starter: 199,
      growth: 449,
      pro: 849,
      starterMinutes: 600,
      growthMinutes: 1500,
      proMinutes: 4000,
      overageRate: 0.20,
      avgCallDuration: 5,
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
        answer: "Yes. FusionCaller is designed with healthcare practices in mind. We follow HIPAA guidelines for handling patient information and can sign a BAA.",
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

  locksmith: {
    name: 'Locksmith',
    slug: 'locksmith',
    icon: 'Key',
    iconComponent: Key,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    tagline: 'Unlock more revenue, never miss a lockout',
    heroTitle: 'AI Receptionist for Locksmiths',
    heroDescription: 'Answer emergency lockout calls 24/7, quote fixed rates instantly, and capture every high-value lead automatically.',
    description: 'AI-powered call answering for locksmith companies',
    pricing: {
      starter: 149,
      growth: 349,
      pro: 699,
      starterMinutes: 500,
      growthMinutes: 1500,
      proMinutes: 4000,
      overageRate: 0.20,
      avgCallDuration: 4,
    },
    painPoints: [
      'Missing emergency lockout calls while on jobs',
      'Competitors answering faster and winning $200-$500 jobs',
      'Can\'t quote standard rates while driving',
      'After-hours calls going to voicemail',
      'No time to follow up on commercial opportunities',
      'Difficulty explaining pricing over the phone',
    ],
    inboundUseCases: [
      {
        icon: 'Phone',
        title: '24/7 Emergency Lockouts',
        description: 'AI answers lockout calls instantly, quotes standard rates ($200-$500), and dispatches you immediately',
      },
      {
        icon: 'Calendar',
        title: 'Service Scheduling',
        description: 'Book rekeying, lock installation, and commercial work automatically',
      },
      {
        icon: 'Users',
        title: 'Lead Qualification',
        description: 'Identify residential vs commercial, urgency level, and service type before you arrive',
      },
      {
        icon: 'MessageSquare',
        title: 'Emergency Alerts',
        description: 'Instant SMS for lockout emergencies requiring immediate response',
      },
      {
        icon: 'DollarSign',
        title: 'Fixed Rate Quoting',
        description: 'Quote standard lockout fees, rekeying ($150-$300), and installation rates over the phone',
      },
    ],
    outboundUseCases: [
      {
        icon: 'Calendar',
        title: 'Commercial Maintenance',
        description: 'Follow up with property managers for annual rekeying and lock maintenance',
      },
      {
        icon: 'Users',
        title: 'New Property Campaigns',
        description: 'Reach out to new homeowners and property managers about security upgrades',
      },
      {
        icon: 'Phone',
        title: 'Estimate Follow-ups',
        description: 'Follow up on commercial quotes for building access systems',
      },
      {
        icon: 'Zap',
        title: 'Security Upgrade Campaigns',
        description: 'Contact past customers about smart locks and security system upgrades',
      },
    ],
    testimonials: [
      {
        quote: "I used to miss 30% of emergency lockout calls. Now every call gets answered instantly and I can quote my $250 lockout fee immediately. Revenue is up 50%.",
        name: "Mike Thompson",
        title: "24/7 Lock & Key",
        location: "Miami, FL",
      },
      {
        quote: "The AI quotes my standard rates perfectly - lockout fees, rekeying, everything. Customers know the price before I arrive, which builds trust.",
        name: "Sarah Rodriguez",
        title: "Secure Locksmith Services",
        location: "Los Angeles, CA",
      },
      {
        quote: "Commercial property managers love that they can get instant quotes. I've landed 3 new commercial accounts just from the AI handling after-hours calls.",
        name: "David Park",
        title: "Premier Locksmith",
        location: "Chicago, IL",
      },
    ],
    faq: [
      {
        question: "Can the AI quote my standard rates?",
        answer: "Absolutely! The AI can quote your standard lockout fees ($200-$500), rekeying rates ($150-$300), and installation pricing. This sets clear expectations and builds trust before you arrive.",
      },
      {
        question: "How does it handle emergency lockouts?",
        answer: "The AI identifies lockout emergencies immediately, quotes your standard rate, confirms the address, and sends you an instant SMS alert with all customer details. You can dispatch immediately.",
      },
      {
        question: "Can it handle commercial vs residential differently?",
        answer: "Yes! The AI can be configured with different pricing and scripts for residential lockouts vs commercial property managers. It automatically qualifies the caller type.",
      },
    ],
    outboundTargets: [
      'Property management companies',
      'New homeowners in your service area',
      'Past commercial clients due for rekeying',
      'Businesses needing access control systems',
    ],
    avgJobValue: '$200 - $500',
    emergencyService: true,
  },

  electrician: {
    name: 'Electrician',
    slug: 'electrician',
    icon: 'Zap',
    iconComponent: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    tagline: 'Power up your business, never miss a call',
    heroTitle: 'AI Receptionist for Electricians',
    heroDescription: 'Answer emergency calls 24/7, quote service fees instantly, and book high-value jobs like panel upgrades automatically.',
    description: 'AI-powered call answering for electrical contractors',
    pricing: {
      starter: 169,
      growth: 389,
      pro: 779,
      starterMinutes: 600,
      growthMinutes: 1800,
      proMinutes: 4500,
      overageRate: 0.20,
      avgCallDuration: 8,
    },
    painPoints: [
      'Missing emergency calls while on jobs',
      'Can\'t quote service call fees while working',
      'Losing $2k-$20k panel upgrade jobs to competitors',
      'After-hours power outage calls going unanswered',
      'No time to follow up on estimate requests',
      'Difficulty explaining pricing for standard services',
    ],
    inboundUseCases: [
      {
        icon: 'Phone',
        title: '24/7 Emergency Response',
        description: 'AI handles power outages, electrical fires, and no-power emergencies instantly',
      },
      {
        icon: 'Calendar',
        title: 'Service Scheduling',
        description: 'Book service calls, panel upgrades ($2k-$8k), and rewiring jobs automatically',
      },
      {
        icon: 'Users',
        title: 'Lead Qualification',
        description: 'Identify emergency vs non-emergency, service type, and property details before dispatch',
      },
      {
        icon: 'MessageSquare',
        title: 'Emergency Alerts',
        description: 'Instant SMS for electrical emergencies requiring immediate attention',
      },
      {
        icon: 'DollarSign',
        title: 'Fixed Rate Quoting',
        description: 'Quote service call fees ($75-$125), standard installations, and provide ballpark estimates',
      },
    ],
    outboundUseCases: [
      {
        icon: 'Calendar',
        title: 'Panel Upgrade Campaigns',
        description: 'Reach out to homeowners with older electrical panels about safety upgrades',
      },
      {
        icon: 'Users',
        title: 'EV Charger Installations',
        description: 'Contact homeowners about electric vehicle charging station installations',
      },
      {
        icon: 'Phone',
        title: 'Estimate Follow-ups',
        description: 'Follow up on quotes for rewiring, panel upgrades, and commercial work',
      },
      {
        icon: 'Zap',
        title: 'Smart Home Upgrades',
        description: 'Reach out about smart switches, lighting, and home automation installations',
      },
    ],
    testimonials: [
      {
        quote: "I used to miss emergency calls constantly. Now every power outage call gets answered instantly. My emergency revenue is up 60%.",
        name: "James Wilson",
        title: "Wilson Electric",
        location: "Phoenix, AZ",
      },
      {
        quote: "The AI quotes my $100 service call fee perfectly. Customers know what to expect, and I've seen my conversion rate increase significantly.",
        name: "Maria Garcia",
        title: "Garcia Electrical Services",
        location: "San Antonio, TX",
      },
      {
        quote: "Panel upgrade campaigns have been a game-changer. The AI calls homeowners with old panels and I've booked $15k in upgrades this month alone.",
        name: "Robert Chen",
        title: "Premier Electric",
        location: "Seattle, WA",
      },
    ],
    faq: [
      {
        question: "Can the AI quote service call fees?",
        answer: "Yes! The AI can quote your standard service call fee ($75-$125) and provide ballpark estimates for common services. For larger jobs like panel upgrades, it schedules an in-person estimate.",
      },
      {
        question: "How does it handle electrical emergencies?",
        answer: "The AI identifies emergencies like power outages, electrical fires, or no power and immediately sends you an SMS alert with customer details and location. It can also provide basic safety guidance while you're en route.",
      },
      {
        question: "Can it handle commercial vs residential differently?",
        answer: "Absolutely. The AI can be configured with different pricing structures and scripts for residential homeowners vs commercial property managers. It automatically qualifies the caller type.",
      },
    ],
    outboundTargets: [
      'Homeowners with panels 20+ years old',
      'New homeowners in your service area',
      'Commercial property managers',
      'Homeowners interested in EV chargers',
    ],
    avgJobValue: '$400 - $1,200',
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

