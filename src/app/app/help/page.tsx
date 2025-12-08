import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { RestartTourButton } from '@/components/onboarding/RestartTourButton'
import Link from 'next/link'
import { 
  HelpCircle, 
  Book, 
  MessageSquare, 
  Mail, 
  Phone,
  Video,
  FileText,
  Zap,
  Users,
  Calendar,
  Settings,
  ExternalLink,
  ArrowRight,
  Lightbulb,
  PlayCircle
} from 'lucide-react'

const quickGuides = [
  {
    title: 'Getting Started',
    description: 'Set up your AI agent in 5 minutes',
    icon: Zap,
    href: '/app/inbound-ai',
  },
  {
    title: 'Managing Leads',
    description: 'Track and follow up with leads',
    icon: Users,
    href: '/app/leads',
  },
  {
    title: 'Calendar & Appointments',
    description: 'View and manage bookings',
    icon: Calendar,
    href: '/app/calendar',
  },
  {
    title: 'Account Settings',
    description: 'Customize your profile and preferences',
    icon: Settings,
    href: '/app/settings',
  },
]

const faqs = [
  {
    question: 'How does the AI answer my calls?',
    answer: 'When someone calls your business number, our AI instantly answers with a professional greeting customized to your business. It handles the conversation naturally, captures the caller\'s information, qualifies the lead, and can even book appointments directly to your calendar.',
  },
  {
    question: 'What information does the AI capture?',
    answer: 'The AI captures: caller name, phone number, email (if provided), address/service location, type of service needed (residential/commercial), property details, and any special requirements. All this appears instantly in your dashboard.',
  },
  {
    question: 'Can I listen to call recordings?',
    answer: 'Yes! Every call is recorded and transcribed. You can listen to the full audio recording, read the transcript, and view an AI-generated summary. This helps you prepare before calling back a lead.',
  },
  {
    question: 'How do I get notified about new leads?',
    answer: 'Go to Settings → Notifications to enable SMS alerts. You can choose to be notified for all inbound calls, only interested leads, callback requests, or booked appointments. Set quiet hours so you\'re not disturbed at night.',
  },
  {
    question: 'What happens if the AI can\'t answer a question?',
    answer: 'The AI is trained on common questions for your industry and your specific business details. If it encounters something unusual, it gracefully takes a message, captures the caller\'s info, and schedules a callback so you never lose a lead.',
  },
  {
    question: 'How do outbound campaigns work?',
    answer: 'Outbound campaigns let you proactively call leads. Create a campaign, add contacts (manually or via CSV import), set your calling schedule, and the AI will call each contact, have a conversation, and tag interested leads for follow-up.',
  },
  {
    question: 'What\'s the difference between inbound and outbound calls?',
    answer: 'Inbound calls are when customers call YOU - the AI answers 24/7 and captures leads. Outbound calls are when your AI calls potential customers from your contact lists to generate new business. Outbound is available on Growth and Pro plans.',
  },
  {
    question: 'How do I customize what the AI says?',
    answer: 'Go to Settings → AI Preferences to update your business services, service areas, and AI personality. For custom scripts or special requirements, contact our support team and we\'ll update your agent.',
  },
  {
    question: 'Can I change my plan?',
    answer: 'Yes! Go to Pricing to upgrade your plan anytime. Upgrades are instant and prorated. To downgrade, contact support and we\'ll help with the transition at your next billing cycle.',
  },
  {
    question: 'How do I add my team members?',
    answer: 'Team member access is coming soon! For now, you can share login credentials or contact support if you need multiple users with different access levels.',
  },
]

export default function HelpPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Help & Support</h2>
          <p className="text-muted-foreground">
            Everything you need to get the most out of FusionCaller
          </p>
        </div>
        <RestartTourButton />
      </div>

      {/* Guided Tour Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <PlayCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">New to FusionCaller?</h3>
              <p className="text-sm text-muted-foreground">
                Take a quick guided tour to learn the basics
              </p>
            </div>
          </div>
          <RestartTourButton />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickGuides.map((guide) => {
          const Icon = guide.icon
          return (
            <Link key={guide.title} href={guide.href}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{guide.title}</h3>
                      <p className="text-sm text-muted-foreground">{guide.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* FAQ Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Contact Support */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Contact Support
              </CardTitle>
              <CardDescription>
                Need help? We're here for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <a 
                href="mailto:support@fusioncaller.com" 
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Support</p>
                  <p className="text-sm text-muted-foreground">support@fusioncaller.com</p>
                </div>
              </a>
              
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Phone Support</p>
                  <p className="text-sm text-muted-foreground">Available on Pro plans</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Response times:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Starter</span>
                    <Badge variant="outline">24-48 hours</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Growth</span>
                    <Badge variant="outline">12-24 hours</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Pro</span>
                    <Badge>4 hours</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Lightbulb className="h-5 w-5" />
                Pro Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-900">
                Update your business profile in Settings to help your AI agent 
                answer questions more accurately. Include your services, service areas, 
                and typical pricing.
              </p>
              <Link href="/app/settings">
                <Button variant="outline" size="sm" className="mt-3 bg-white">
                  Go to Settings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground opacity-60">
                <Book className="h-4 w-4" />
                User Guide
                <Badge variant="outline" className="ml-auto text-xs">Coming Soon</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground opacity-60">
                <Video className="h-4 w-4" />
                Video Tutorials
                <Badge variant="outline" className="ml-auto text-xs">Coming Soon</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground opacity-60">
                <FileText className="h-4 w-4" />
                API Documentation
                <Badge variant="outline" className="ml-auto text-xs">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

