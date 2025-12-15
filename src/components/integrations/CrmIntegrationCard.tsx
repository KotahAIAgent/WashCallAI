'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Check, X, RefreshCw, Database } from 'lucide-react'

interface CrmIntegration {
  id: string
  crm_type: string
  display_name: string | null
  sync_enabled: boolean
  last_sync_at: string | null
  last_sync_status: string | null
  active: boolean
}

interface CrmIntegrationCardProps {
  organizationId: string
  integrations: CrmIntegration[]
  onRefresh?: () => void
}

export function CrmIntegrationCard({ organizationId, integrations, onRefresh }: CrmIntegrationCardProps) {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    crmType: 'custom',
    displayName: '',
    apiEndpoint: '',
    apiKey: '',
    apiSecret: '',
    authType: 'api_key' as 'api_key' | 'oauth2' | 'basic',
  })

  async function handleTestConnection() {
    setTesting(true)
    try {
      const response = await fetch('/api/crm/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crmType: formData.crmType,
          apiEndpoint: formData.apiEndpoint,
          apiKey: formData.apiKey,
          apiSecret: formData.apiSecret,
          authType: formData.authType,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Connection Successful',
          description: 'CRM connection test passed!',
        })
      } else {
        toast({
          title: 'Connection Failed',
          description: result.error || 'Failed to connect to CRM',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to test connection',
        variant: 'destructive',
      })
    } finally {
      setTesting(false)
    }
  }

  async function handleConnect() {
    if (!formData.apiEndpoint || !formData.apiKey) {
      toast({
        title: 'Error',
        description: 'API endpoint and API key are required',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/crm/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          crmType: formData.crmType,
          displayName: formData.displayName || null,
          apiEndpoint: formData.apiEndpoint,
          apiKey: formData.apiKey,
          apiSecret: formData.apiSecret || undefined,
          authType: formData.authType,
        }),
      })

      const result = await response.json()

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'CRM connected successfully!',
        })
        onRefresh?.()
        setFormData({
          crmType: 'custom',
          displayName: '',
          apiEndpoint: '',
          apiKey: '',
          apiSecret: '',
          authType: 'api_key',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect CRM',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSync(integrationId: string) {
    setLoading(true)
    try {
      const response = await fetch('/api/crm/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crmIntegrationId: integrationId,
          organizationId,
        }),
      })

      const result = await response.json()

      if (result.error) {
        toast({
          title: 'Sync Failed',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Sync Successful',
          description: `Synced ${result.stats?.invoices || 0} invoices, ${result.stats?.estimates || 0} estimates, ${result.stats?.services || 0} services`,
        })
        onRefresh?.()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sync',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          CRM Integration
        </CardTitle>
        <CardDescription>
          Connect your CRM to sync invoices, estimates, and customer data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Integrations */}
        {integrations.length > 0 && (
          <div className="space-y-2">
            <Label>Connected CRMs</Label>
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {integration.last_sync_status === 'success' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : integration.last_sync_status === 'failed' ? (
                      <X className="h-4 w-4 text-red-500" />
                    ) : null}
                    <span className="font-medium">
                      {integration.display_name || integration.crm_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({integration.crm_type})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {integration.last_sync_at && (
                    <span className="text-xs text-muted-foreground">
                      Last synced: {new Date(integration.last_sync_at).toLocaleDateString()}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSync(integration.id)}
                    disabled={loading}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Sync
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Integration */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>Connect CRM</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Connect CRM</DialogTitle>
              <DialogDescription>
                Connect your CRM to automatically sync invoices, estimates, and customer data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>CRM Type</Label>
                <Select
                  value={formData.crmType}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, crmType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markate">Markate</SelectItem>
                    <SelectItem value="custom">Custom REST API</SelectItem>
                    {/* Add more CRMs as needed */}
                  </SelectContent>
                </Select>
              </div>

              {formData.crmType === 'custom' && (
                <div className="space-y-2">
                  <Label>Display Name (Optional)</Label>
                  <Input
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, displayName: e.target.value }))
                    }
                    placeholder="My Custom CRM"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>API Endpoint *</Label>
                <Input
                  value={formData.apiEndpoint}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, apiEndpoint: e.target.value }))
                  }
                  placeholder="https://api.yourcrm.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Authentication Type</Label>
                <Select
                  value={formData.authType}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, authType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="oauth2">OAuth2 (Bearer Token)</SelectItem>
                    <SelectItem value="basic">Basic Authentication</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>API Key *</Label>
                <Input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                  }
                  placeholder="Your API key"
                  required
                />
              </div>

              {(formData.authType === 'basic' || formData.authType === 'oauth2') && (
                <div className="space-y-2">
                  <Label>API Secret</Label>
                  <Input
                    type="password"
                    value={formData.apiSecret}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, apiSecret: e.target.value }))
                    }
                    placeholder="Your API secret"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || !formData.apiEndpoint || !formData.apiKey}
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleConnect}
                  disabled={loading || !formData.apiEndpoint || !formData.apiKey}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

