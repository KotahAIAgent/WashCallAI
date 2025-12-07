'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

interface CreditBalanceProps {
  creditAmount: number
  setupFeeCredited: boolean
}

export function CreditBalance({ creditAmount, setupFeeCredited }: CreditBalanceProps) {
  const creditDollars = (creditAmount / 100).toFixed(2)

  if (creditAmount === 0 && !setupFeeCredited) {
    return null
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Account Credit
        </CardTitle>
      </CardHeader>
      <CardContent>
        {creditAmount > 0 && (
          <div className="mb-3">
            <div className="text-3xl font-bold text-primary">${creditDollars}</div>
            <p className="text-sm text-muted-foreground">
              This credit will automatically apply to your next invoice.
            </p>
          </div>
        )}
        {setupFeeCredited && (
          <div className="text-sm text-muted-foreground">
            ✓ Setup fee credited after 6 months of subscription
          </div>
        )}
      </CardContent>
    </Card>
  )
}

