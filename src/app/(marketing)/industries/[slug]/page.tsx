import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { getIndustryBySlug, getIndustrySlugs, type IndustrySlug } from '@/lib/industries/config'
import { 
  Check, 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Zap, 
  Users, 
  Calendar, 
  MessageSquare,
  Clock,
  Shield,
  Star,
  ArrowRight,
  Play,
  Sparkles,
  Target,
  Building2
} from 'lucide-react'
import type { Metadata } from 'next'

// Generate static params for all industries
export async function generateStaticParams() {
  const slugs = getIndustrySlugs()
  return slugs.map((slug) => ({ slug }))
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const industry = getIndustryBySlug(params.slug)
  
  if (!industry) {
    return { title: 'Industry Not Found' }
  }

  return {
    title: `${industry.heroTitle} | FusionCaller`,
    description: industry.heroDescription,
  }
}

// Icon mapping for use cases
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Phone,
  Calendar,
  Users,
  MessageSquare,
  Zap,
  Target,
}

export default function IndustryPage({ params }: { params: { slug: string } }) {
  const industry = getIndustryBySlug(params.slug)

  if (!industry) {
    notFound()
  }

  const IconComponent = industry.iconComponent

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center">
        {/* Background */}
        <div className={`absolute inset-0 bg-gradient-to-br from-slate-50 ${industry.bgColor}/30 to-white`} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwZDk0ODgiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        
        {/* Decorative blurs */}
        <div className={`absolute top-20 left-10 w-72 h-72 ${industry.bgColor} rounded-full blur-3xl opacity-50`} />
        <div className={`absolute bottom-20 right-10 w-96 h-96 ${industry.bgColor} rounded-full blur-3xl opacity-30`} />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Industry Badge */}
            <div className="flex justify-center mb-6">
              <Badge variant="outline" className={`px-4 py-2 ${industry.bgColor} border-current`}>
                <IconComponent className={`w-4 h-4 mr-2 ${industry.color}`} />
                <span className={industry.color}>FusionCaller for {industry.name}</span>
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="text-gray-900">{industry.heroTitle}</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              {industry.heroDescription}
            </p>

            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-8">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span>Avg job value: {industry.avgJobValue}</span>
              </div>
              {industry.emergencyService && (
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-red-500" />
                  <span>24/7 Emergency Support</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/signup">
                <Button size="lg" className={`w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg`}>
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-2">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-500" />
                <span>Setup in 24-48 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">The Problem</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Sound Familiar?
              </h2>
              <p className="text-xl text-gray-600">
                {industry.name} businesses face unique challenges when it comes to answering calls
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {industry.painPoints.map((painPoint, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{painPoint}</span>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-lg text-gray-600">
                <span className="font-semibold text-teal-600">FusionCaller</span> solves all of these problems automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">How It Works</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Two AI Agents, Built for {industry.name}
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Inbound AI */}
              <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-xl bg-teal-100">
                      <PhoneIncoming className="h-6 w-6 text-teal-600" />
                    </div>
                    <Badge className="bg-teal-100 text-teal-700">Inbound AI</Badge>
                  </div>
                  <CardTitle className="text-xl">AI Receptionist</CardTitle>
                  <CardDescription>
                    Answers every call 24/7 so you never miss a lead
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {industry.inboundUseCases.map((useCase, i) => {
                    const UseCaseIcon = iconMap[useCase.icon] || Phone
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="p-2 rounded-lg bg-teal-100 h-fit">
                          <UseCaseIcon className="h-4 w-4 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium">{useCase.title}</p>
                          <p className="text-sm text-gray-600">{useCase.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Outbound AI */}
              <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-white">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-xl bg-cyan-100">
                      <PhoneOutgoing className="h-6 w-6 text-cyan-600" />
                    </div>
                    <Badge className="bg-cyan-100 text-cyan-700">Outbound AI</Badge>
                    <Badge variant="outline" className="text-xs">Premium</Badge>
                  </div>
                  <CardTitle className="text-xl">AI Sales Caller</CardTitle>
                  <CardDescription>
                    Proactively grows your business with automated outreach
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {industry.outboundUseCases.map((useCase, i) => {
                    const UseCaseIcon = iconMap[useCase.icon] || Phone
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="p-2 rounded-lg bg-cyan-100 h-fit">
                          <UseCaseIcon className="h-4 w-4 text-cyan-600" />
                        </div>
                        <div>
                          <p className="font-medium">{useCase.title}</p>
                          <p className="text-sm text-gray-600">{useCase.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Outbound Targets */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Outbound Targeting</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Who Should You Call?
              </h2>
              <p className="text-xl text-gray-600">
                Our AI can automatically reach out to these high-value targets
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {industry.outboundTargets.map((target, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-cyan-50 rounded-lg border border-cyan-100">
                  <Target className="h-5 w-5 text-cyan-600 flex-shrink-0" />
                  <span className="text-gray-700">{target}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">{industry.name} Pricing</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-600">
                Plans designed specifically for {industry.name.toLowerCase()} businesses
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Starter */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-teal-500" />
                    Starter
                  </CardTitle>
                  <CardDescription>Perfect for getting started</CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">${industry.pricing.starter}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    + $99 one-time setup fee
                    <br />
                    <span className="text-xs">(Refunded if you cancel during trial)</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {[
                      'Unlimited inbound AI calls',
                      'Lead capture & management',
                      'Call recordings & transcripts',
                      'SMS notifications',
                      'Email support',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    <li className="flex items-center gap-2 pt-2 border-t">
                      <Check className="h-5 w-5 text-teal-500" />
                      <span className="font-medium text-teal-700">CRM & Calendar Integration (included)</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/signup" className="w-full">
                    <Button variant="outline" className="w-full">Get Started</Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Growth */}
              <Card className="relative border-2 border-teal-500 shadow-xl shadow-teal-500/10 scale-105">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-teal-500 text-white px-4 py-1">Most Popular</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    Growth
                  </CardTitle>
                  <CardDescription>For businesses ready to scale</CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">${industry.pricing.growth}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    + $149 one-time setup fee
                    <br />
                    <span className="text-xs">(Refunded if you cancel during trial)</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {[
                      'Everything in Starter',
                      '500 outbound AI calls/month',
                      '3 active campaigns',
                      'Campaign contact management',
                      'Advanced analytics',
                      'Priority support',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    <li className="flex items-center gap-2 pt-2 border-t">
                      <Check className="h-5 w-5 text-teal-500" />
                      <span className="font-medium text-teal-700">CRM & Calendar Integration (included)</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/signup" className="w-full">
                    <Button className="w-full bg-teal-600 hover:bg-teal-700">Get Started</Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Pro */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-500" />
                    Pro
                  </CardTitle>
                  <CardDescription>For high-volume operations</CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">${industry.pricing.pro}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    + $199 one-time setup fee
                    <br />
                    <span className="text-xs">(Refunded if you cancel during trial)</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {[
                      'Everything in Growth',
                      '2,500 outbound calls/month',
                      'Unlimited campaigns',
                      'Custom AI voice & scripts',
                      'API access',
                      'Dedicated account manager',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    <li className="flex items-center gap-2 pt-2 border-t">
                      <Check className="h-5 w-5 text-teal-500" />
                      <span className="font-medium text-teal-700">CRM & Calendar Integration (included)</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/signup" className="w-full">
                    <Button variant="outline" className="w-full">Get Started</Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included in Setup */}
      <section className="py-20 bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">What's Included</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What's Included in Your Setup Fee
              </h2>
              <p className="text-xl text-gray-600">
                Your one-time setup fee covers everything you need to get started
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-teal-100">
                      <Sparkles className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Custom AI Agent Creation</h3>
                      <p className="text-sm text-gray-600">
                        We create and test a custom AI agent tailored to your business, services, and communication style.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-blue-100">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">CRM Integration</h3>
                      <p className="text-sm text-gray-600">
                        Connect with most popular CRMs including HubSpot, Salesforce, Pipedrive, Zoho, and more.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-purple-100">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Calendar Sync</h3>
                      <p className="text-sm text-gray-600">
                        Automatic sync with Google Calendar, Outlook, Calendly, and other calendar systems.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-amber-100">
                      <Zap className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Testing & Training</h3>
                      <p className="text-sm text-gray-600">
                        Comprehensive testing, training, and customization to ensure your AI agent works perfectly for your business.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 p-6 bg-white rounded-lg border-2 border-teal-200">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-teal-900 mb-1">Setup Fee Refund Policy</p>
                  <p className="text-sm text-gray-700">
                    Your setup fee is fully refunded if you cancel during your 7-day free trial. No questions asked - we want you to be happy with FusionCaller.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Success Stories</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Trusted by {industry.name} Businesses
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {industry.testimonials.map((testimonial, i) => (
                <Card key={i} className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-5 w-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.title}</p>
                      <p className="text-sm text-gray-500">{testimonial.location}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">FAQ</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Questions About FusionCaller for {industry.name}?
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              {industry.faq.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="bg-white rounded-lg border px-6">
                  <AccordionTrigger className="text-left font-medium py-4">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className={`inline-flex p-4 rounded-2xl bg-white/10 backdrop-blur mb-6`}>
              <IconComponent className="h-12 w-12" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Transform Your {industry.name} Business?
            </h2>
            <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
              Join other {industry.name.toLowerCase()} businesses using FusionCaller to capture more leads 
              and grow revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-white text-teal-600 hover:bg-teal-50 text-lg px-8 py-6">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                Schedule Demo
              </Button>
            </div>
            <p className="text-teal-200 mt-6 text-sm">
              No credit card required • 7-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

