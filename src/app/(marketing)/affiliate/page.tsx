import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Gift, DollarSign, Users, TrendingUp, Copy, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Affiliate Program | FusionCaller',
  description: 'Earn commissions by referring FusionCaller',
}

export default function AffiliatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Partner Program</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              FusionCaller Affiliate Program
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Earn recurring commissions for every customer you refer
            </p>
          </div>

          <div className="space-y-12">
            {/* Program Overview */}
            <Card className="bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-6 w-6 text-primary" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-background rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-2">1</div>
                    <h3 className="font-semibold mb-2">Sign Up</h3>
                    <p className="text-sm text-muted-foreground">
                      Join our affiliate program and get your unique referral link
                    </p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-2">2</div>
                    <h3 className="font-semibold mb-2">Share</h3>
                    <p className="text-sm text-muted-foreground">
                      Share your link with your audience - blog, social media, email
                    </p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-2">3</div>
                    <h3 className="font-semibold mb-2">Earn</h3>
                    <p className="text-sm text-muted-foreground">
                      Get paid monthly for every active customer you refer
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Commission Structure */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Commission Structure
                </CardTitle>
                <CardDescription>Earn recurring monthly commissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">Voice Agent Plan</h3>
                        <p className="text-sm text-muted-foreground">$129/month</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">20%</div>
                        <div className="text-sm text-muted-foreground">$25.80/mo</div>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 bg-primary/5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">Combo Plan</h3>
                        <p className="text-sm text-muted-foreground">$299/month</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">20%</div>
                        <div className="text-sm text-muted-foreground">$59.80/mo</div>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">Enterprise Plan</h3>
                        <p className="text-sm text-muted-foreground">$599+/month</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">25%</div>
                        <div className="text-sm text-muted-foreground">$150+/mo</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm">
                      <strong>Plus:</strong> Earn $50 bonus for every referral that subscribes for 3+ months
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Why Join?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { icon: DollarSign, title: 'Recurring Commissions', desc: 'Earn every month your referral stays active' },
                    { icon: Users, title: 'No Limits', desc: 'Refer unlimited customers - the more, the better' },
                    { icon: CheckCircle2, title: 'Easy Tracking', desc: 'Real-time dashboard shows all your referrals and earnings' },
                    { icon: Gift, title: 'Bonus Rewards', desc: 'Special bonuses for top performers' },
                  ].map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                      <benefit.icon className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-1">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sign Up Form */}
            <Card>
              <CardHeader>
                <CardTitle>Join the Program</CardTitle>
                <CardDescription>Fill out the form below to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" required placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" required placeholder="john@example.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website/Blog URL</Label>
                    <Input id="website" type="url" placeholder="https://yoursite.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promotion">How do you plan to promote FusionCaller? *</Label>
                    <textarea
                      id="promotion"
                      required
                      className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                      placeholder="Blog posts, social media, email list, etc."
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Apply to Affiliate Program
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    We'll review your application and get back to you within 2-3 business days
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">How often are commissions paid?</h3>
                  <p className="text-sm text-muted-foreground">
                    Commissions are paid monthly, 30 days after the end of each month. Minimum payout is $50.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">How long do I earn commissions?</h3>
                  <p className="text-sm text-muted-foreground">
                    You earn recurring commissions for as long as your referral remains a paying customer. This is a true recurring revenue opportunity.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Can I use multiple tracking links?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes! You can create custom tracking links for different campaigns, platforms, or content types.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">What payment methods are available?</h3>
                  <p className="text-sm text-muted-foreground">
                    We pay via PayPal, bank transfer (ACH), or wire transfer. You can set your preferred payment method in your affiliate dashboard.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

