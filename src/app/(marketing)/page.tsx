'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { IndustrySelector } from '@/components/marketing/IndustrySelector'
import { IndustryGrid } from '@/components/marketing/IndustryGrid'
import { ROICalculator } from '@/components/marketing/ROICalculator'
import { CallRecordingsShowcase } from '@/components/marketing/CallRecordingsShowcase'
import { DoneForYouSection } from '@/components/marketing/DoneForYouSection'
import { CostComparisonSection } from '@/components/marketing/CostComparisonSection'
import { BookDemoDialog } from '@/components/marketing/BookDemoDialog'
import { motion } from 'framer-motion'
import { 
  Check, 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Zap, 
  Users, 
  Calendar, 
  BarChart3,
  MessageSquare,
  Clock,
  Shield,
  Star,
  ArrowRight,
  Play,
  Sparkles,
  Building2
} from 'lucide-react'

// Container variants for the hero section
const container = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.4, 0, 0.2, 1] as const,
      when: 'beforeChildren',
      staggerChildren: 0.15,
    },
  },
}

// Item variants for individual hero elements
const item = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const },
  },
}

export default function HomePage() {
  const [showDemo, setShowDemo] = useState(false)
  
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background - Modern gradient with pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/50" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwZDk0ODgiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto text-center"
          >
            {/* Eyebrow text / badge */}
            <motion.div variants={item}>
              <Badge variant="outline" className="mb-6 px-4 py-1.5 border-teal-200 bg-teal-50 text-teal-700">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered • 24/7 Availability • No Missed Calls
              </Badge>
            </motion.div>
            
            {/* Main headline */}
            <motion.h1 variants={item} className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-teal-800 to-teal-600 bg-clip-text text-transparent">
                FusionCaller
              </span>
              <br />
              <span className="text-gray-900">Another Customer Again</span>
            </motion.h1>
            
            {/* Supporting paragraph */}
            <motion.p variants={item} className="text-xl md:text-2xl text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              <Badge variant="outline" className="mb-4">🚀 No Code Required</Badge>
              <br />
              AI receptionist that answers calls 24/7, captures leads, and books appointments 
              for your business. While you're on the job. <strong>Zero coding needed</strong> — we set it up for you.
            </motion.p>
            <motion.div variants={item} className="flex items-center justify-center gap-4 mb-10">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                🌍 50+ Languages Supported
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                ⚡ 5-Minute Setup
              </Badge>
            </motion.div>

            {/* Industry Selector */}
            <motion.div variants={item} className="mb-8">
              <p className="text-sm text-gray-500 mb-3">Select your industry to see how it works:</p>
              <IndustrySelector />
            </motion.div>
            
            {/* CTA buttons */}
            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg shadow-teal-500/25">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <BookDemoDialog>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto text-lg px-8 py-6 border-2"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Book a Demo
                </Button>
              </BookDemoDialog>
            </motion.div>

            {/* Trust badges / social proof */}
            <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-500" />
                <span>5-minute setup</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <span>Trusted by 500+ businesses</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Industry Grid Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Industries We Serve</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Built for Your Industry
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Click your industry to see specific features, pricing, and success stories
              </p>
            </div>

            <IndustryGrid />
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Sound Familiar?
              </h2>
              <p className="text-xl text-gray-600">
                You're on the job, the phone rings, and you can't answer...
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {/* Problems */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">❌</span>
                  Without FusionCaller
                </h3>
                <div className="space-y-3">
                  {[
                    'Missing calls while on jobs = lost revenue',
                    'Customers hang up on voicemail',
                    'No time to call back leads',
                    'Competitors answer faster and win the job',
                    'Inconsistent follow-up with past customers',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
                      <div className="w-2 h-2 rounded-full bg-red-400 mt-2" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solutions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">✓</span>
                  With FusionCaller
                </h3>
                <div className="space-y-3">
                  {[
                    'Every call answered instantly, 24/7/365',
                    'AI captures leads while you work',
                    'Appointments booked automatically',
                    'SMS alerts for hot leads immediately',
                    'AI follows up with past customers for you',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Call Recordings */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <CallRecordingsShowcase />
          </div>
        </div>
      </section>

      {/* Done For You Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <DoneForYouSection />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Features</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Two Powerful AI Agents, One Platform
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Inbound AI answers your calls. Outbound AI grows your business.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Inbound AI */}
              <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-xl bg-teal-100">
                      <PhoneIncoming className="h-6 w-6 text-teal-600" />
                    </div>
                    <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100">Inbound</Badge>
                  </div>
                  <CardTitle className="text-2xl">AI Receptionist</CardTitle>
                  <CardDescription className="text-base">
                    Never miss a call again. Your AI answers 24/7 and captures every lead.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { icon: Phone, text: 'Answers calls instantly, day or night' },
                    { icon: Users, text: 'Captures name, phone, address, service needed' },
                    { icon: Calendar, text: 'Books appointments directly to your calendar' },
                    { icon: MessageSquare, text: 'Sends you SMS alerts for hot leads' },
                    { icon: BarChart3, text: 'Records calls and generates summaries' },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-teal-100">
                        <feature.icon className="h-4 w-4 text-teal-600" />
                      </div>
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Outbound AI */}
              <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-white overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-xl bg-cyan-100">
                      <PhoneOutgoing className="h-6 w-6 text-cyan-600" />
                    </div>
                    <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100">Outbound</Badge>
                    <Badge variant="outline" className="text-xs">Premium</Badge>
                  </div>
                  <CardTitle className="text-2xl">AI Sales Caller</CardTitle>
                  <CardDescription className="text-base">
                    Proactively reach out to leads and grow your customer base automatically. <Badge variant="outline" className="ml-2 text-xs">🚀 No Code Setup</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { icon: Users, text: 'Calls leads from your contact lists' },
                    { icon: Zap, text: 'Re-engages past customers for repeat business' },
                    { icon: Phone, text: 'Cold calls prospects in your target market' },
                    { icon: MessageSquare, text: 'Leaves professional voicemails' },
                    { icon: BarChart3, text: 'Tags interested leads for follow-up' },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-cyan-100">
                        <feature.icon className="h-4 w-4 text-cyan-600" />
                      </div>
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Simple Setup</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Get Started in 3 Easy Steps
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Tell Us About Your Business',
                  description: 'Share your services, pricing, and service areas. No coding required — we\'ll customize your AI agent for you.',
                  icon: Building2,
                },
                {
                  step: '2',
                  title: 'We Set Up Your Agent',
                  description: 'Our team creates and tests your custom AI agent, integrates with your CRM and calendar, and customizes everything within 24-48 hours.',
                  icon: Zap,
                },
                {
                  step: '3',
                  title: 'Start Getting Leads',
                  description: 'Your AI answers calls, captures leads, and books appointments automatically.',
                  icon: Phone,
                },
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="text-center">
                    <div className="relative inline-flex">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
                        <item.icon className="h-7 w-7" />
                      </div>
                      <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-teal-100 text-teal-600 font-bold flex items-center justify-center text-sm border-2 border-white">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mt-6 mb-3">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-gray-200" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cost Comparison Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <CostComparisonSection />
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <ROICalculator />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Pricing</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-600">
                Pricing varies by industry. Select yours above to see specific rates.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Voice Agent */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-teal-500" />
                    Voice Agent
                  </CardTitle>
                  <CardDescription>AI phone receptionist - perfect for getting started</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">From $129</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">+ $99 setup</span>
                      <Badge variant="outline" className="text-xs">Refunded if you cancel during trial</Badge>
                    </div>
                    <span className="text-xs text-teal-600 font-semibold">
                      ✨ Setup credited back after 6 months
                    </span>
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

              {/* Combo - Featured */}
              <Card className="relative border-2 border-teal-500 shadow-xl shadow-teal-500/10 scale-105">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-teal-500 text-white px-4 py-1">Most Popular</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    Combo
                  </CardTitle>
                  <CardDescription>Voice + Web AI agents - for businesses ready to scale</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">From $299</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">+ $149 setup</span>
                      <Badge variant="outline" className="text-xs">Refunded if you cancel during trial</Badge>
                    </div>
                    <span className="text-xs text-teal-600 font-semibold">
                      ✨ Setup credited back after 6 months
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {[
                      'Everything in Voice Agent',
                      'Outbound minutes included (varies by industry)',
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
                    <span className="text-4xl font-bold">From $599</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">+ $199 setup</span>
                      <Badge variant="outline" className="text-xs">Refunded if you cancel during trial</Badge>
                    </div>
                    <span className="text-xs text-teal-600 font-semibold">
                      ✨ Setup credited back after 6 months
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {[
                      'Everything in Combo',
                      'Outbound minutes included (varies by industry)',
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

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Testimonials</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Loved by Service Businesses
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "I used to miss 5-10 calls a day while on jobs. Now I never miss a single one. My leads have doubled!",
                  name: "Mike Johnson",
                  title: "Clean Pro Pressure Washing",
                  location: "Houston, TX",
                },
                {
                  quote: "The AI sounds so natural, customers don't even know they're talking to AI. It's incredible.",
                  name: "Dr. Lisa Park",
                  title: "Bright Smile Dental",
                  location: "San Diego, CA",
                },
                {
                  quote: "Our emergency revenue is up 40% because we never miss after-hours calls anymore.",
                  name: "Mike Rodriguez",
                  title: "Cool Comfort HVAC",
                  location: "Phoenix, AZ",
                },
              ].map((testimonial, i) => (
                <Card key={i} className="bg-white">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">FAQ</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              {[
                {
                  q: "What happens if I miss a call?",
                  a: "You won't! Our AI receptionist answers every call instantly, 24/7/365. Even after hours, weekends, and holidays. Every lead is captured automatically."
                },
                {
                  q: "How natural does the AI sound?",
                  a: "Extremely natural. Our AI uses advanced voice technology that sounds like a real human. Most callers don't realize they're speaking with AI."
                },
                {
                  q: "Can I customize what the AI says?",
                  a: "Absolutely. We customize your AI with your business name, services, pricing, and service areas. You can also set up specific scripts for different situations."
                },
                {
                  q: "How long does setup take?",
                  a: "Most businesses are up and running within 24-48 hours. You fill out a form about your business, and our team handles the rest."
                },
                {
                  q: "What industries do you support?",
                  a: "We support HVAC, plumbing, landscaping, pressure washing, dental practices, and many more service businesses. Select your industry above to see specific features."
                },
                {
                  q: "Can I listen to call recordings?",
                  a: "Yes! Every call is recorded and transcribed. You can listen to recordings, read transcripts, and view AI-generated summaries in your dashboard."
                },
              ].map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="bg-gray-50 rounded-lg border px-6">
                  <AccordionTrigger className="text-left font-medium py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-4">
                    {faq.a}
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
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Never Miss a Customer Again?
            </h2>
            <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
              Join 500+ service businesses using FusionCaller to capture more leads 
              and grow their business.
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

      {/* Video Demo Modal */}
      <Dialog open={showDemo} onOpenChange={setShowDemo}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>See FusionCaller in Action</DialogTitle>
            <DialogDescription>
              Watch how our AI handles calls and captures leads automatically
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full aspect-video bg-black rounded-b-lg overflow-hidden">
            <video
              className="w-full h-full"
              controls
              autoPlay
              playsInline
            >
              <source src="/demo-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
