'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Check, Copy, ExternalLink, Loader2, Lock, Webhook } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface Integration {
  id: string
  name: string
  description: string
  icon: LucideIcon
  category: string
  status: 'available' | 'coming_soon' | 'connected'
  popular?: boolean
}

interface IntegrationCardProps {
  integration: Integration
  organizationId: string
  isConnected: boolean
  isPro: boolean
}

export function IntegrationCard({ 
  integration, 
  organizationId, 
  isConnected,
  isPro 
}: IntegrationCardProps) {
  const [showSetup, setShowSetup] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Generate webhook URL for Zapier
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.nevermiss.ai'}/api/webhooks/zapier/${organizationId}`

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast({ title: 'Copied to clipboard!' })
    setTimeout(() => setCopied(false), 2000)
  }

  if (integration.status === 'coming_soon') {
    return (
      <Button variant="outline" disabled>
        Coming Soon
      </Button>
    )
  }

  if (!isPro && integration.id !== 'zapier') {
    return (
      <Button variant="outline" disabled>
        <Lock className="h-4 w-4 mr-2" />
        Pro Plan Required
      </Button>
    )
  }

  return (
    <>
      <Button 
        variant={isConnected ? 'outline' : 'default'}
        onClick={() => setShowSetup(true)}
      >
        {isConnected ? (
          <>
            <Check className="h-4 w-4 mr-2 text-green-500" />
            Connected
          </>
        ) : (
          'Connect'
        )}
      </Button>

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-orange-500" />
              Connect to Zapier
            </DialogTitle>
            <DialogDescription>
              Use these webhook URLs in your Zapier triggers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* How it works */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">How to set up:</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Create a new Zap in Zapier</li>
                <li>Choose "Webhooks by Zapier" as the trigger</li>
                <li>Select "Catch Hook" as the event</li>
                <li>Copy the webhook URL below and paste it in Zapier</li>
                <li>Test the connection and build your automation!</li>
              </ol>
            </div>

            {/* Webhook URLs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New Lead Webhook</Label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={`${webhookUrl}/new-lead`}
                    className="font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(`${webhookUrl}/new-lead`)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Triggers when a new lead is captured from a call
                </p>
              </div>

              <div className="space-y-2">
                <Label>Appointment Booked Webhook</Label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={`${webhookUrl}/appointment-booked`}
                    className="font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(`${webhookUrl}/appointment-booked`)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Triggers when an appointment is scheduled
                </p>
              </div>

              <div className="space-y-2">
                <Label>Call Completed Webhook</Label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={`${webhookUrl}/call-completed`}
                    className="font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(`${webhookUrl}/call-completed`)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Triggers after every call (inbound or outbound)
                </p>
              </div>
            </div>

            {/* External link */}
            <a 
              href="https://zapier.com/app/zaps" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Open Zapier Dashboard
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowSetup(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

