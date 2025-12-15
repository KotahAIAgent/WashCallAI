'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Copy, Check, ExternalLink, Webhook } from 'lucide-react'
import Image from 'next/image'

interface ZapierIntegrationCardProps {
  organizationId: string
}

export function ZapierIntegrationCard({ organizationId }: ZapierIntegrationCardProps) {
  const [copied, setCopied] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const { toast } = useToast()

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://app.fusioncaller.com'}/api/webhooks/zapier/${organizationId}`

  async function copyToClipboard() {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    toast({
      title: 'Copied!',
      description: 'Webhook URL copied to clipboard',
    })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowSetup(true)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Zapier Logo - using their brand color */}
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF4A00] to-[#FF6B35] flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">Z</span>
            </div>
            <div>
              <CardTitle className="text-xl">Zapier</CardTitle>
              <CardDescription className="mt-1">
                Connect your CRM via Zapier for automatic sync
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setShowSetup(true) }}>
            Setup
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Webhook className="h-4 w-4" />
          <span>Sync invoices, estimates, and services automatically</span>
        </div>
      </CardContent>

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF4A00] to-[#FF6B35] flex items-center justify-center">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <div>
                <DialogTitle>Connect Zapier</DialogTitle>
                <DialogDescription>
                  Sync your CRM data automatically through Zapier
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* How it works */}
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                How it works:
              </h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-2">
                <li>Create a Zap in Zapier connecting your CRM (Markate, etc.) to FusionCaller</li>
                <li>Use the webhook URL below as your Zapier action endpoint</li>
                <li>Zapier will automatically send invoices, estimates, and services to FusionCaller</li>
                <li>FusionCaller will automatically create follow-up campaigns for overdue invoices and pending estimates</li>
              </ol>
            </div>

            {/* Webhook URL */}
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={webhookUrl}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this URL in your Zapier "Webhooks by Zapier" action
              </p>
            </div>

            {/* Payload Examples */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Invoice Payload Example:</Label>
                <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
{`{
  "type": "invoice",
  "invoice_number": "INV-001",
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "customer_email": "john@example.com",
  "amount": 500.00,
  "currency": "USD",
  "issue_date": "2024-01-15",
  "due_date": "2024-02-15",
  "status": "pending"
}`}
                </pre>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">Estimate Payload Example:</Label>
                <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
{`{
  "type": "estimate",
  "estimate_number": "EST-001",
  "customer_name": "Jane Smith",
  "customer_phone": "+1234567890",
  "amount": 750.00,
  "issue_date": "2024-01-20",
  "status": "pending",
  "service_type": "House Washing",
  "property_address": "123 Main St"
}`}
                </pre>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">Service Payload Example:</Label>
                <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
{`{
  "type": "service",
  "customer_name": "Bob Johnson",
  "customer_phone": "+1234567890",
  "service_type": "Pressure Washing",
  "service_date": "2024-01-10",
  "amount": 300.00,
  "property_address": "456 Oak Ave"
}`}
                </pre>
              </div>
            </div>

            {/* Zapier Link */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://zapier.com/app/zaps', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Zapier Dashboard
              </Button>
            </div>

            {/* Cost Note */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> Zapier has a free tier (100 tasks/month). For higher volumes, 
                customers will need a paid Zapier plan. This cost is paid by the customer, not FusionCaller.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

