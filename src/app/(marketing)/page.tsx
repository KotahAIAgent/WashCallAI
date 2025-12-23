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
import { AnimatedGridBackground, FloatingOrb, ParticleField } from '@/components/ui/animated-background'
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
  Building2,
  Rocket,
  Bot
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

// Card hover animation
const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -8,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
}

export default function HomePage() {
  const [showDemo, setShowDemo] = useState(false)
  
  return (
    <div className="overflow-hidden bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <AnimatedGridBackground />
          <ParticleField className="opacity-50" />
        </div>
        
        {/* Extra floating orbs for depth */}
        <FloatingOrb color="purple" size="lg" className="top-20 right-20 opacity-30" delay={0} />
        <FloatingOrb color="cyan" size="md" className="bottom-40 left-20 opacity-20" delay={3} />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-5xl mx-auto text-center"
          >
            {/* Eyebrow badge */}
            <motion.div variants={item}>
              <Badge 
                variant="outline" 
                className="mb-8 px-5 py-2 border-purple-500/30 bg-purple-500/10 text-purple-300 backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                AI-Powered • 24/7 Availability • Zero Missed Calls
              </Badge>
            </motion.div>
            
            {/* Main headline with gradient text */}
            <motion.h1 variants={item} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8">
              <span className="gradient-text">FusionCaller</span>
              <br />
              <span className="text-foreground/90">Never Miss</span>
              <br />
              <span className="text-foreground">Another Customer</span>
            </motion.h1>
            
            {/* Supporting paragraph */}
            <motion.p variants={item} className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              AI receptionist that answers calls{' '}
              <span className="text-purple-400 font-semibold">24/7</span>, captures leads, and books appointments 
              — while you focus on the job.{' '}
              <span className="text-cyan-400 font-semibold">Zero coding required.</span>
            </motion.p>
            
            {/* Feature badges */}
            <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-3 mb-12">
              <Badge className="bg-gradient-to-r from-purple-500/20 to-purple-500/10 text-purple-300 border-purple-500/30 px-4 py-2">
                <Bot className="w-4 h-4 mr-2" />
                50+ Languages
              </Badge>
              <Badge className="bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 text-cyan-300 border-cyan-500/30 px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                5-Minute Setup
              </Badge>
              <Badge className="bg-gradient-to-r from-pink-500/20 to-pink-500/10 text-pink-300 border-pink-500/30 px-4 py-2">
                <Rocket className="w-4 h-4 mr-2" />
                No Code Required
              </Badge>
            </motion.div>

            {/* Industry Selector */}
            <motion.div variants={item} className="mb-10">
              <p className="text-sm text-muted-foreground mb-4">Select your industry to see how it works:</p>
              <IndustrySelector />
            </motion.div>
            
            {/* CTA buttons */}
            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-lg px-10 py-7 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 hover:from-purple-500 hover:via-purple-400 hover:to-pink-400 shadow-lg shadow-purple-500/25 btn-glow font-semibold"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <BookDemoDialog>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto text-lg px-10 py-7 border-2 border-purple-500/50 hover:border-purple-400 hover:bg-purple-500/10 text-foreground font-semibold"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Book a Demo
                </Button>
              </BookDemoDialog>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-green-500/20">
                  <Shield className="h-4 w-4 text-green-400" />
                </div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-cyan-500/20">
                  <Clock className="h-4 w-4 text-cyan-400" />
                </div>
                <span>5-minute setup</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-amber-500/20">
                  <Star className="h-4 w-4 text-amber-400" />
                </div>
                <span>Trusted by 500+ businesses</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Industry Grid Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/5 to-background" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <Badge className="mb-4 bg-purple-500/10 text-purple-300 border-purple-500/30">Industries We Serve</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Built for <span className="gradient-text">Your Industry</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Click your industry to see specific features, pricing, and success stories
              </p>
            </motion.div>

            <IndustryGrid />
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-24 relative overflow-hidden">
        <FloatingOrb color="pink" size="xl" className="top-0 right-0 translate-x-1/2 -translate-y-1/2 opacity-20" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Sound <span className="text-pink-400">Familiar?</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                You're on the job, the phone rings, and you can't answer...
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {/* Problems */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-red-400 flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-lg">❌</span>
                  Without FusionCaller
                </h3>
                <div className="space-y-3">
                  {[
                    'Missing calls while on jobs = lost revenue',
                    'Customers hang up on voicemail',
                    'No time to call back leads',
                    'Competitors answer faster and win the job',
                    'Inconsistent follow-up with past customers',
                  ].map((text, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20 backdrop-blur-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Solutions */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-green-400 flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">✓</span>
                  With FusionCaller
                </h3>
                <div className="space-y-3">
                  {[
                    'Every call answered instantly, 24/7/365',
                    'AI captures leads while you work',
                    'Appointments booked automatically',
                    'SMS alerts for hot leads immediately',
                    'AI follows up with past customers for you',
                  ].map((text, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20 backdrop-blur-sm"
                    >
                      <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Call Recordings */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-cyan-950/5 to-background" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <CallRecordingsShowcase />
          </div>
        </div>
      </section>

      {/* Done For You Section */}
      <section className="py-24 relative">
        <FloatingOrb color="purple" size="lg" className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2 opacity-15" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <DoneForYouSection />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/5 to-background" />
        <FloatingOrb color="cyan" size="xl" className="top-1/2 left-0 -translate-x-1/2 opacity-15" />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <Badge className="mb-4 bg-cyan-500/10 text-cyan-300 border-cyan-500/30">Features</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Two Powerful <span className="gradient-text">AI Agents</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Inbound AI answers your calls. Outbound AI grows your business.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Inbound AI */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                whileHover="hover"
                variants={cardHover}
              >
                <Card className="h-full glass-card border-purple-500/20 hover:border-purple-500/40 transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                        <PhoneIncoming className="h-6 w-6 text-white" />
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Inbound</Badge>
                    </div>
                    <CardTitle className="text-2xl">AI Receptionist</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
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
                      <div key={i} className="flex items-center gap-3 group">
                        <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                          <feature.icon className="h-4 w-4 text-purple-400" />
                        </div>
                        <span className="text-muted-foreground">{feature.text}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Outbound AI */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover="hover"
                variants={cardHover}
              >
                <Card className="h-full glass-card border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25">
                        <PhoneOutgoing className="h-6 w-6 text-white" />
                      </div>
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Outbound</Badge>
                      <Badge variant="outline" className="text-xs border-pink-500/30 text-pink-300">Premium</Badge>
                    </div>
                    <CardTitle className="text-2xl">AI Sales Caller</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      Proactively reach out to leads and grow your customer base automatically.
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
                      <div key={i} className="flex items-center gap-3 group">
                        <div className="p-2 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                          <feature.icon className="h-4 w-4 text-cyan-400" />
                        </div>
                        <span className="text-muted-foreground">{feature.text}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <Badge className="mb-4 bg-green-500/10 text-green-300 border-green-500/30">Simple Setup</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Get Started in <span className="text-green-400">3 Easy Steps</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Tell Us About Your Business',
                  description: 'Share your services, pricing, and service areas. No coding required — we\'ll customize your AI agent for you.',
                  icon: Building2,
                  color: 'purple',
                },
                {
                  step: '2',
                  title: 'We Set Up Your Agent',
                  description: 'Our team creates and tests your custom AI agent, integrates with your CRM and calendar within 24-48 hours.',
                  icon: Zap,
                  color: 'cyan',
                },
                {
                  step: '3',
                  title: 'Start Getting Leads',
                  description: 'Your AI answers calls, captures leads, and books appointments automatically.',
                  icon: Phone,
                  color: 'green',
                },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="text-center">
                    <div className="relative inline-flex mb-6">
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${
                        item.color === 'purple' ? 'from-purple-500 to-pink-500 shadow-purple-500/30' :
                        item.color === 'cyan' ? 'from-cyan-500 to-blue-500 shadow-cyan-500/30' :
                        'from-green-500 to-emerald-500 shadow-green-500/30'
                      } flex items-center justify-center text-white shadow-lg`}>
                        <item.icon className="h-8 w-8" />
                      </div>
                      <span className={`absolute -top-2 -right-2 w-8 h-8 rounded-full ${
                        item.color === 'purple' ? 'bg-purple-500' :
                        item.color === 'cyan' ? 'bg-cyan-500' :
                        'bg-green-500'
                      } text-white font-bold flex items-center justify-center text-sm shadow-lg`}>
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-border/50" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cost Comparison Section */}
      <section className="py-24 relative">
        <FloatingOrb color="pink" size="lg" className="top-1/2 right-0 translate-x-1/2 opacity-15" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <CostComparisonSection />
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/5 to-background" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <ROICalculator />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative overflow-hidden">
        <FloatingOrb color="cyan" size="xl" className="bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 opacity-10" />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <Badge className="mb-4 bg-amber-500/10 text-amber-300 border-amber-500/30">Pricing</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Simple, <span className="text-amber-400">Transparent</span> Pricing
              </h2>
              <p className="text-xl text-muted-foreground">
                Pricing varies by industry. Select yours above to see specific rates.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Voice Agent */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                whileHover="hover"
                variants={cardHover}
              >
                <Card className="h-full glass-card border-border/50 hover:border-purple-500/30 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Zap className="h-5 w-5 text-purple-400" />
                      </div>
                      Voice Agent
                    </CardTitle>
                    <CardDescription>AI phone receptionist - perfect for getting started</CardDescription>
                    <div className="mt-4">
                      <span className="text-5xl font-black gradient-text">$129</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <div className="mt-3 text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">+ $99 setup</span>
                        <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Refundable</Badge>
                      </div>
                      <span className="text-xs text-purple-400 font-medium">
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
                        <li key={i} className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                      <li className="flex items-center gap-3 pt-3 border-t border-border/50">
                        <Check className="h-5 w-5 text-purple-400 flex-shrink-0" />
                        <span className="font-medium text-purple-300">CRM & Calendar Integration</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/signup" className="w-full">
                      <Button variant="outline" className="w-full border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50">
                        Get Started
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* Combo - Featured */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover="hover"
                variants={cardHover}
                className="lg:-mt-4"
              >
                <div className="relative">
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 rounded-2xl opacity-70 blur-sm" />
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 rounded-2xl animate-gradient-x bg-[length:200%_100%]" />
                  <Card className="relative h-full bg-card border-0 rounded-2xl">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 shadow-lg">
                        Most Popular
                      </Badge>
                    </div>
                    <CardHeader className="pt-8">
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-500/30">
                          <Star className="h-5 w-5 text-amber-400" />
                        </div>
                        Combo
                      </CardTitle>
                      <CardDescription>Voice + Web AI agents - for businesses ready to scale</CardDescription>
                      <div className="mt-4">
                        <span className="text-5xl font-black gradient-text">$299</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <div className="mt-3 text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">+ $149 setup</span>
                          <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Refundable</Badge>
                        </div>
                        <span className="text-xs text-purple-400 font-medium">
                          ✨ Setup credited back after 6 months
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-3">
                        {[
                          'Everything in Voice Agent',
                          'Outbound minutes included',
                          '3 active campaigns',
                          'Campaign contact management',
                          'Advanced analytics',
                          'Priority support',
                        ].map((feature, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                        <li className="flex items-center gap-3 pt-3 border-t border-border/50">
                          <Check className="h-5 w-5 text-purple-400 flex-shrink-0" />
                          <span className="font-medium text-purple-300">CRM & Calendar Integration</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link href="/signup" className="w-full">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 shadow-lg shadow-purple-500/25">
                          Get Started
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </div>
              </motion.div>

              {/* Pro */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover="hover"
                variants={cardHover}
              >
                <Card className="h-full glass-card border-border/50 hover:border-cyan-500/30 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-cyan-500/20">
                        <Shield className="h-5 w-5 text-cyan-400" />
                      </div>
                      Pro
                    </CardTitle>
                    <CardDescription>For high-volume operations</CardDescription>
                    <div className="mt-4">
                      <span className="text-5xl font-black gradient-text">$599</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <div className="mt-3 text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">+ $199 setup</span>
                        <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Refundable</Badge>
                      </div>
                      <span className="text-xs text-purple-400 font-medium">
                        ✨ Setup credited back after 6 months
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {[
                        'Everything in Combo',
                        'Unlimited outbound minutes',
                        'Unlimited campaigns',
                        'Custom AI voice & scripts',
                        'API access',
                        'Dedicated account manager',
                      ].map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                      <li className="flex items-center gap-3 pt-3 border-t border-border/50">
                        <Check className="h-5 w-5 text-purple-400 flex-shrink-0" />
                        <span className="font-medium text-purple-300">CRM & Calendar Integration</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/signup" className="w-full">
                      <Button variant="outline" className="w-full border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-500/50">
                        Get Started
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-pink-950/5 to-background" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <Badge className="mb-4 bg-pink-500/10 text-pink-300 border-pink-500/30">Testimonials</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Loved by <span className="text-pink-400">Service Businesses</span>
              </h2>
            </motion.div>

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
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  whileHover="hover"
                  variants={cardHover}
                >
                  <Card className="h-full glass-card border-border/50 hover:border-pink-500/30 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="h-5 w-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                      <div className="pt-4 border-t border-border/50">
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 relative">
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <Badge className="mb-4 bg-blue-500/10 text-blue-300 border-blue-500/30">FAQ</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Frequently Asked <span className="text-blue-400">Questions</span>
              </h2>
            </motion.div>
            
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
                <AccordionItem 
                  key={i} 
                  value={`item-${i}`} 
                  className="glass-card rounded-xl border border-border/50 px-6 data-[state=open]:border-purple-500/30"
                >
                  <AccordionTrigger className="text-left font-medium py-4 hover:no-underline hover:text-purple-400 transition-colors">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 via-purple-800/50 to-pink-900/50" />
        <FloatingOrb color="purple" size="xl" className="top-0 left-0 -translate-x-1/2 -translate-y-1/2 opacity-30" />
        <FloatingOrb color="pink" size="lg" className="bottom-0 right-0 translate-x-1/2 translate-y-1/2 opacity-30" />
        <div className="absolute inset-0 bg-grid opacity-10" />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-6xl font-black mb-8">
                Ready to <span className="gradient-text">Never Miss</span>
                <br />
                Another Customer?
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Join 500+ service businesses using FusionCaller to capture more leads 
                and grow their business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link href="/signup">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto text-lg px-10 py-7 bg-white text-purple-900 hover:bg-gray-100 shadow-2xl shadow-white/20 font-semibold"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <BookDemoDialog>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto text-lg px-10 py-7 border-2 border-white/30 hover:bg-white/10 font-semibold"
                  >
                    Schedule Demo
                  </Button>
                </BookDemoDialog>
              </div>
              <p className="text-muted-foreground text-sm">
                No credit card required • 7-day free trial • Cancel anytime
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Video Demo Modal */}
      <Dialog open={showDemo} onOpenChange={setShowDemo}>
        <DialogContent className="max-w-4xl w-full p-0 glass-card border-border/50">
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
