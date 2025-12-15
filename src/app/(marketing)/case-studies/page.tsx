import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, Phone, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Case Studies | FusionCaller',
  description: 'Real success stories from FusionCaller customers',
}

const caseStudies = [
  {
    id: 1,
    title: '2.5X Call Volume in 8 Months',
    company: 'Dental Tourism Leader',
    industry: 'Healthcare',
    challenge: 'Struggling to handle peak call times and missing potential patients during off-hours',
    solution: 'Implemented FusionCaller AI receptionist to handle 24/7 inbound calls with intelligent lead capture',
    results: [
      { metric: 'Call Volume Increase', value: '2.5X', description: 'More calls handled without additional staff' },
      { metric: 'Response Time', value: 'Instant', description: 'Zero missed calls, even during peak hours' },
      { metric: 'Cost Savings', value: '$8,400/mo', description: 'Eliminated need for 24/7 reception staff' },
      { metric: 'Lead Capture Rate', value: '98%', description: 'Every call captured with full details' },
    ],
    testimonial: 'FusionCaller transformed how we handle patient inquiries. We never miss a call, and the AI captures every detail perfectly. It\'s like having a perfect receptionist that never sleeps.',
  },
  {
    id: 2,
    title: 'From 15 to 100+ Calls/Day — Half the Workload',
    company: 'Home Services Business',
    industry: 'Home Services',
    challenge: 'Small team overwhelmed by call volume, missing follow-ups with past customers',
    solution: 'Deployed both inbound AI receptionist and outbound campaigns for customer re-engagement',
    results: [
      { metric: 'Daily Calls', value: '15 → 100+', description: '6.6X increase in handled calls' },
      { metric: 'Workload Reduction', value: '50%', description: 'Team focused on closing, not answering' },
      { metric: 'Past Customer Re-engagement', value: '30%', description: 'Repeat business from outbound campaigns' },
      { metric: 'Booking Rate', value: '+40%', description: 'More appointments booked automatically' },
    ],
    testimonial: 'Our team can finally focus on the work we love instead of being tied to the phone. The outbound campaigns brought back customers we hadn\'t heard from in months.',
  },
  {
    id: 3,
    title: '4 Countries. Zero Chaos. One Scalable System.',
    company: 'International Service Provider',
    industry: 'Professional Services',
    challenge: 'Managing calls across multiple countries with different languages and time zones',
    solution: 'Centralized FusionCaller system with multi-language support and local phone numbers',
    results: [
      { metric: 'Countries Served', value: '4', description: 'Unified system across all locations' },
      { metric: 'Languages', value: '5+', description: 'AI handles multiple languages seamlessly' },
      { metric: 'Setup Time', value: '< 48 hours', description: 'Fast deployment per location' },
      { metric: 'Consistency', value: '100%', description: 'Same quality service everywhere' },
    ],
    testimonial: 'Expanding internationally used to mean chaos. FusionCaller gave us one system that works everywhere, with local numbers and multilingual support. Game changer.',
  },
]

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Success Stories</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Real Results from Real Customers
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how businesses across industries are transforming their operations with FusionCaller
            </p>
          </div>

          <div className="space-y-12">
            {caseStudies.map((study) => (
              <Card key={study.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{study.title}</CardTitle>
                      <CardDescription className="text-base">
                        <strong>{study.company}</strong> • {study.industry}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{study.industry}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  {/* Challenge & Solution */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <span className="text-red-500">Challenge</span>
                      </h3>
                      <p className="text-muted-foreground">{study.challenge}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <span className="text-green-500">Solution</span>
                      </h3>
                      <p className="text-muted-foreground">{study.solution}</p>
                    </div>
                  </div>

                  {/* Results */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Results
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {study.results.map((result, idx) => (
                        <Card key={idx} className="border-primary/20">
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-primary mb-1">
                              {result.value}
                            </div>
                            <div className="text-sm font-medium mb-1">
                              {result.metric}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {result.description}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Testimonial */}
                  <div className="border-t pt-6">
                    <div className="bg-primary/5 p-6 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium mb-1">Customer Testimonial</p>
                          <p className="text-muted-foreground italic">&ldquo;{study.testimonial}&rdquo;</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <Card className="mt-16 bg-gradient-to-r from-primary to-primary/80 text-white border-0">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Write Your Success Story?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join hundreds of businesses using FusionCaller to transform their operations
              </p>
              <div className="flex gap-4 justify-center">
                <a href="/signup">
                  <button className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                    Start Free Trial
                  </button>
                </a>
                <a href="/#pricing">
                  <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                    View Pricing
                  </button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

