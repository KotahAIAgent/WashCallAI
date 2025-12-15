'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Users, Clock } from 'lucide-react'

export function CostComparisonSection() {
  const receptionistCost = 3200
  const fusioncallerCost = 249
  const savings = receptionistCost - fusioncallerCost
  const savingsPercent = (savings / receptionistCost) * 100

  return (
    <Card className="w-full">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">
            ${fusioncallerCost} <span className="text-2xl font-normal">VS</span> ${receptionistCost.toLocaleString()}+
          </h2>
          <p className="text-lg text-muted-foreground">
            What you're paying for ONE receptionist... FusionCaller gives you THREE 24/7 agents for a fraction of that.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Receptionist Cost */}
          <Card className="border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold text-lg">Traditional Receptionist</h3>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Working 8 hours/day, 5 days/week = 160 hours/month
                </div>
                <div className="text-sm">
                  $20/hour × 160 hours = <strong className="text-lg">${receptionistCost.toLocaleString()} every month</strong>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Whether they're answering calls or twiddling thumbs — you pay the same.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FusionCaller Cost */}
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-lg">FusionCaller</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">💻 1 Web AI Agent</Badge>
                  <Badge variant="outline">📞 2 Phone AI Agents</Badge>
                </div>
                <div className="text-sm">
                  Available <strong>24/7</strong> — never sick, never late, never sleeps
                </div>
                <div className="text-lg font-bold text-green-600 pt-2 border-t">
                  ${fusioncallerCost}/month flat
                </div>
                <div className="text-xs text-muted-foreground">
                  No hourly wages. No benefits. No idle time cost.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Savings Highlight */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">You're saving</div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                ${savings.toLocaleString()} every single month
              </div>
              <div className="text-lg text-muted-foreground">
                That's <strong>over {savingsPercent.toFixed(0)}% in savings</strong> — every. single. month.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example with Usage */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" />
            <span className="font-semibold">With actual usage:</span>
          </div>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>
              5-minute average call × 30 calls/day × 22 working days = 3,300 minutes
            </p>
            <p>
              3,300 minutes × $0.16 = <strong>$528 usage</strong> + $249 platform = <strong>$777 total</strong>
            </p>
            <p className="text-green-600 font-semibold">
              Still 75% cheaper than a receptionist — and that's with heavy usage!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

