'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Webhook, Copy, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FormWebhookCardProps {
  webhookUrl: string
}

export function FormWebhookCard({ webhookUrl }: FormWebhookCardProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Form Submission Webhook
        </CardTitle>
        <CardDescription>
          Connect Facebook Ads and Google Ads forms to automatically create leads and trigger calls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            Use this URL in your Facebook Ads or Google Ads form submission webhooks.
            When a form is submitted, we'll automatically create a lead and call the customer.
          </p>
        </div>

        <div className="p-4 bg-muted rounded-lg space-y-2">
          <Label className="text-sm font-semibold">Expected Payload Format:</Label>
          <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
{`{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "serviceType": "House Washing",
  "message": "Need house washing service",
  "propertyType": "residential",
  "source": "facebook"
}`}
          </pre>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> Make sure to set the <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">X-Webhook-Secret</code> header
            in your webhook configuration. The secret should match your <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">FORM_WEBHOOK_SECRET</code> environment variable.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

