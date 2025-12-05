import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReferralStats } from '@/components/referrals/ReferralStats'
import { ShareLinks } from '@/components/referrals/ShareLinks'
import { ReferralHistory } from '@/components/referrals/ReferralHistory'
import { Gift, DollarSign, Users, Award, Sparkles } from 'lucide-react'

async function getReferralData(organizationId: string) {
  const supabase = createServerClient()
  
  // Get organization's referral code
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, referral_code')
    .eq('id', organizationId)
    .single()

  // Generate referral code if it doesn't exist
  let referralCode = org?.referral_code
  if (!referralCode) {
    referralCode = `WASH${organizationId.slice(0, 6).toUpperCase()}`
    await supabase
      .from('organizations')
      .update({ referral_code: referralCode })
      .eq('id', organizationId)
  }

  // Get referral stats
  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', organizationId)
    .order('created_at', { ascending: false })

  const totalReferrals = referrals?.length || 0
  const successfulReferrals = referrals?.filter(r => r.status === 'completed').length || 0
  const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0
  const totalEarnings = referrals
    ?.filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.reward_amount || 0), 0) || 0

  return {
    referralCode,
    referralLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.washcall.ai'}/signup?ref=${referralCode}`,
    stats: {
      totalReferrals,
      successfulReferrals,
      pendingReferrals,
      totalEarnings,
    },
    referrals: referrals || [],
  }
}

export default async function ReferralsPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return <div>Not authenticated</div>
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.organization_id) {
    return <div>No organization found</div>
  }

  const data = await getReferralData(profile.organization_id)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Gift className="h-6 w-6" />
          Referral Program
        </h2>
        <p className="text-muted-foreground">
          Earn $50 for every business you refer that signs up for a paid plan
        </p>
      </div>

      {/* Hero Banner */}
      <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-primary">Give $50, Get $50</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">
                Share WashCall AI with other businesses
              </h3>
              <p className="text-muted-foreground max-w-lg">
                When a business signs up using your link and subscribes to any paid plan, 
                you both get $50 credit. There's no limit to how many you can refer!
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-5xl font-bold text-primary">$50</div>
              <Badge className="bg-primary/20 text-primary">Per Successful Referral</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.pendingReferrals} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.stats.successfulReferrals}</div>
            <p className="text-xs text-muted-foreground">
              Completed referrals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.stats.totalEarnings}</div>
            <p className="text-xs text-muted-foreground">
              Applied as credits
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              ${data.stats.pendingReferrals * 50}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Share Section */}
      <ShareLinks 
        referralCode={data.referralCode}
        referralLink={data.referralLink}
      />

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>Three simple steps to earn rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-semibold mb-1">Share Your Link</h4>
              <p className="text-sm text-muted-foreground">
                Send your unique referral link to other pressure washing businesses
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h4 className="font-semibold mb-1">They Sign Up</h4>
              <p className="text-sm text-muted-foreground">
                When they create an account and subscribe to a paid plan
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h4 className="font-semibold mb-1">You Both Earn</h4>
              <p className="text-sm text-muted-foreground">
                You get $50 credit, they get $50 off their first bill
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <ReferralHistory referrals={data.referrals} />
    </div>
  )
}

