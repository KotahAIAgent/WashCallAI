'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Phone, Building2, Image } from 'lucide-react'
import { useState } from 'react'

interface BrandedCallerIDSettingsProps {
  enabled?: boolean
  brandedName?: string
  brandedLogoUrl?: string
  callReason?: string
  onEnabledChange: (enabled: boolean) => void
  onBrandedNameChange: (name: string) => void
  onBrandedLogoUrlChange: (url: string) => void
  onCallReasonChange: (reason: string) => void
}

export function BrandedCallerIDSettings({
  enabled = false,
  brandedName = '',
  brandedLogoUrl = '',
  callReason = '',
  onEnabledChange,
  onBrandedNameChange,
  onBrandedLogoUrlChange,
  onCallReasonChange,
}: BrandedCallerIDSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Branded Caller ID
        </CardTitle>
        <CardDescription>
          Show your company name, logo, and reason for calling to increase answer rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="brandedEnabled">Enable Branded Caller ID</Label>
            <p className="text-sm text-muted-foreground">
              Display your company branding on recipient's caller ID
            </p>
          </div>
          <Switch
            id="brandedEnabled"
            checked={enabled}
            onCheckedChange={onEnabledChange}
          />
        </div>

        {enabled && (
          <div className="space-y-4 pl-4 border-l-2">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="brandedName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Name *
              </Label>
              <Input
                id="brandedName"
                placeholder="Acme Corp"
                value={brandedName}
                onChange={(e) => onBrandedNameChange(e.target.value)}
                required={enabled}
              />
              <p className="text-xs text-muted-foreground">
                This name will appear on the recipient's caller ID screen
              </p>
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="brandedLogo" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Logo URL (Optional)
              </Label>
              <Input
                id="brandedLogo"
                type="url"
                placeholder="https://example.com/logo.png"
                value={brandedLogoUrl}
                onChange={(e) => onBrandedLogoUrlChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Square logo image URL (recommended: 200x200px PNG)
              </p>
            </div>

            {/* Call Reason */}
            <div className="space-y-2">
              <Label htmlFor="callReason">Call Reason</Label>
              <Textarea
                id="callReason"
                placeholder="Following up on your recent inquiry about our services"
                value={callReason}
                onChange={(e) => onCallReasonChange(e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Brief reason for calling (shown on some carrier displays)
              </p>
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Caller ID:</span>
                  <span className="font-semibold">{brandedName || '(Your company name)'}</span>
                </div>
                {callReason && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Reason:</span>
                    <span>{callReason}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Branded Caller ID availability varies by carrier and region. 
            Some carriers may not support logo display. This feature may require additional setup 
            with your telecom provider.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

