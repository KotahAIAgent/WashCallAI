'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Phone, 
  Sparkles, 
  ArrowRight, 
  PhoneIncoming,
  Users,
  Rocket
} from 'lucide-react'

export function EmptyDashboard() {
  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-blue-500/10 border-primary/20">
        <CardContent className="pt-8 pb-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Welcome to FusionCaller! 🎉</h3>
            <p className="text-muted-foreground mb-6">
              Your AI-powered calling assistant is ready to help grow your pressure washing business. 
              Here's how to get started:
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Steps */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden">
          <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
            1
          </div>
          <CardContent className="pt-16 pb-6">
            <PhoneIncoming className="h-10 w-10 text-green-500 mb-4" />
            <h4 className="font-semibold mb-2">Configure Inbound AI</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Set up your AI to answer incoming calls 24/7, capture leads, and book appointments automatically.
            </p>
            <Link href="/app/inbound-ai">
              <Button variant="outline" size="sm" className="w-full">
                Set Up Inbound
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
            2
          </div>
          <CardContent className="pt-16 pb-6">
            <Users className="h-10 w-10 text-blue-500 mb-4" />
            <h4 className="font-semibold mb-2">Receive Your First Call</h4>
            <p className="text-sm text-muted-foreground mb-4">
              When someone calls your business number, your AI will answer, qualify the lead, and notify you.
            </p>
            <Link href="/app/leads">
              <Button variant="outline" size="sm" className="w-full">
                View Leads
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
            3
          </div>
          <CardContent className="pt-16 pb-6">
            <Sparkles className="h-10 w-10 text-purple-500 mb-4" />
            <h4 className="font-semibold mb-2">Watch Your Business Grow</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Track calls, monitor leads, and see your conversion rates improve with AI-powered insights.
            </p>
            <Link href="/app/calls">
              <Button variant="outline" size="sm" className="w-full">
                View Calls
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Tips Card */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="p-3 rounded-full bg-amber-100">
              <Sparkles className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="font-semibold">Pro Tip</h4>
              <p className="text-sm text-muted-foreground">
                Make sure your AI agent is configured with your business details, service areas, and pricing 
                so it can accurately answer customer questions and qualify leads.
              </p>
            </div>
            <Link href="/app/settings">
              <Button variant="secondary">
                Update Business Info
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

