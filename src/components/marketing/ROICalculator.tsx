'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calculator, TrendingUp, DollarSign } from 'lucide-react'

export function ROICalculator() {
  const [sdrSalary, setSdrSalary] = useState(50000)
  const [numSdrs, setNumSdrs] = useState(3)
  const [talkMinutes, setTalkMinutes] = useState(3300)
  const [additionalAgents, setAdditionalAgents] = useState(0)
  const [packageType, setPackageType] = useState<'voice' | 'combo'>('voice')

  // Pricing constants
  const PACKAGE_PRICES = {
    voice: { monthly: 149, setup: 149, perMinute: 0.16, agents: 1 },
    combo: { monthly: 249, setup: 249, perMinute: 0.16, agents: 2 },
  }

  const calculateSavings = () => {
    const selectedPackage = PACKAGE_PRICES[packageType]
    
    // Calculate current monthly cost
    const monthlySdrSalary = sdrSalary / 12
    const benefitsOverhead = monthlySdrSalary * 0.30 // 30% for benefits/overhead
    const currentMonthlyCost = (monthlySdrSalary + benefitsOverhead) * numSdrs
    
    // Calculate AI package cost
    const baseCost = selectedPackage.monthly
    const talkTimeCost = (talkMinutes / 60) * selectedPackage.perMinute
    const additionalAgentsCost = additionalAgents * 50
    const firstMonthTotal = baseCost + selectedPackage.setup + talkTimeCost + additionalAgentsCost
    const monthlyCost = baseCost + talkTimeCost + additionalAgentsCost

    // Calculate savings
    const monthlySavings = currentMonthlyCost - monthlyCost
    const annualSavings = monthlySavings * 12
    const savingsPercent = currentMonthlyCost > 0 ? ((monthlySavings / currentMonthlyCost) * 100) : 0

    // Calculate advantage (talk time)
    const sdrTalkTimePerDay = 8 // 8 hours = 480 minutes
    const sdrTalkTimePerMonth = sdrTalkTimePerDay * 22 // Working days
    const aiTalkTimePerDay = (talkMinutes / 22) // Minutes per day
    const aiTalkTimeHoursPerDay = aiTalkTimePerDay / 60

    return {
      currentMonthlyCost,
      monthlyCost,
      firstMonthTotal,
      monthlySavings,
      annualSavings,
      savingsPercent,
      aiTalkTimeHoursPerDay,
      sdrTalkTimePerMonth,
    }
  }

  const results = calculateSavings()

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Calculator className="h-6 w-6" />
          Calculate Your Speed Advantage
        </CardTitle>
        <CardDescription>
          See how instant response impacts your bottom line
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sdrSalary">Average SDR Salary (Annual)</Label>
            <Input
              id="sdrSalary"
              type="number"
              value={sdrSalary}
              onChange={(e) => setSdrSalary(Number(e.target.value))}
              min={30000}
              max={150000}
              step={5000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numSdrs">Number of SDRs</Label>
            <Input
              id="numSdrs"
              type="number"
              value={numSdrs}
              onChange={(e) => setNumSdrs(Number(e.target.value))}
              min={1}
              max={20}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="packageType">AI Package</Label>
            <Select value={packageType} onValueChange={(v: 'voice' | 'combo') => setPackageType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="voice">
                  Voice Agent — ${PACKAGE_PRICES.voice.monthly}/mo + ${PACKAGE_PRICES.voice.setup} setup + ${PACKAGE_PRICES.voice.perMinute}/min
                </SelectItem>
                <SelectItem value="combo">
                  Combo (Voice + Web) — ${PACKAGE_PRICES.combo.monthly}/mo + ${PACKAGE_PRICES.combo.setup} setup + ${PACKAGE_PRICES.combo.perMinute}/min
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="talkMinutes">Monthly Talk Minutes</Label>
            <Input
              id="talkMinutes"
              type="number"
              value={talkMinutes}
              onChange={(e) => setTalkMinutes(Number(e.target.value))}
              min={0}
              step={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalAgents">Additional Voice Agents ($50 each)</Label>
            <Input
              id="additionalAgents"
              type="number"
              value={additionalAgents}
              onChange={(e) => setAdditionalAgents(Number(e.target.value))}
              min={0}
              max={10}
            />
          </div>
        </div>

        {/* Results */}
        <div className="border-t pt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Current Cost */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Current Monthly Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{numSdrs} SDRs × ${(sdrSalary / 12).toLocaleString()}/month</span>
                    <span>${((sdrSalary / 12) * numSdrs).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Benefits & overhead (30%)</span>
                    <span>${(((sdrSalary / 12) * 0.3) * numSdrs).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Monthly Cost</span>
                    <span>${results.currentMonthlyCost.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Package Cost */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">AI Package Monthly Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Base ({packageType === 'voice' ? 'Voice Agent' : 'Combo'})</span>
                    <span>${PACKAGE_PRICES[packageType].monthly}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Talk time ({talkMinutes} min × ${PACKAGE_PRICES[packageType].perMinute})</span>
                    <span>${((talkMinutes / 60) * PACKAGE_PRICES[packageType].perMinute).toFixed(2)}</span>
                  </div>
                  {additionalAgents > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Additional agents ({additionalAgents} × $50)</span>
                      <span>${(additionalAgents * 50).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>One-time setup</span>
                    <span>${PACKAGE_PRICES[packageType].setup} (first month)</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Monthly Cost</span>
                    <span>${results.monthlyCost.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Savings Highlight */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-3 text-center">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Monthly Savings</div>
                  <div className="text-3xl font-bold text-green-600">
                    ${results.monthlySavings.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Annual Savings</div>
                  <div className="text-3xl font-bold text-green-600">
                    ${results.annualSavings.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Savings %</div>
                  <div className="text-3xl font-bold text-green-600">
                    {results.savingsPercent.toFixed(0)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Advantage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Key Advantage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-center mb-2">
                {results.aiTalkTimeHoursPerDay.toFixed(1)} Hours Pure Talk Time Daily
              </div>
              <p className="text-center text-muted-foreground text-sm">
                No admin work, no dialing time, no breaks
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

