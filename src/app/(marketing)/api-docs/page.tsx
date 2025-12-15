import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Code, Terminal, Key, Webhook } from 'lucide-react'

export const metadata: Metadata = {
  title: 'API Documentation | FusionCaller',
  description: 'FusionCaller API documentation for developers',
}

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Developer Resources</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              API Documentation
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Integrate FusionCaller into your applications with our REST API
            </p>
          </div>

          <div className="space-y-8">
            {/* Getting Started */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">API Base URL</h3>
                  <code className="block bg-muted p-3 rounded-md text-sm">
                    https://api.fusioncaller.com/v1
                  </code>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Authentication</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    All API requests require authentication using an API key in the Authorization header:
                  </p>
                  <code className="block bg-muted p-3 rounded-md text-sm">
                    Authorization: Bearer YOUR_API_KEY
                  </code>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Getting Your API Key</h3>
                  <p className="text-sm text-muted-foreground">
                    Navigate to Settings → API Keys in your FusionCaller dashboard to generate a new API key.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Webhooks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhooks
                </CardTitle>
                <CardDescription>Receive real-time events from FusionCaller</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Form Submission Webhook</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Receive form submissions from Facebook/Google Ads:
                  </p>
                  <code className="block bg-muted p-3 rounded-md text-sm">
                    POST /api/webhooks/form-submission?orgId=YOUR_ORG_ID
                  </code>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Zapier Webhook</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Receive CRM data from Zapier:
                  </p>
                  <code className="block bg-muted p-3 rounded-md text-sm">
                    POST /api/webhooks/zapier/[organizationId]
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* API Endpoints */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API Endpoints
                </CardTitle>
                <CardDescription>Core API endpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Get Calls</h3>
                  <code className="block bg-muted p-3 rounded-md text-sm mb-2">
                    GET /api/calls?organizationId=YOUR_ORG_ID
                  </code>
                  <p className="text-sm text-muted-foreground">
                    Retrieve a list of calls for your organization
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Get Leads</h3>
                  <code className="block bg-muted p-3 rounded-md text-sm mb-2">
                    GET /api/leads?organizationId=YOUR_ORG_ID
                  </code>
                  <p className="text-sm text-muted-foreground">
                    Retrieve captured leads
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Initiate Outbound Call</h3>
                  <code className="block bg-muted p-3 rounded-md text-sm mb-2">
                    POST /api/calls/initiate
                  </code>
                  <p className="text-sm text-muted-foreground">
                    Trigger an outbound AI call
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Search Transcripts</h3>
                  <code className="block bg-muted p-3 rounded-md text-sm mb-2">
                    GET /api/calls/search-transcripts?q=QUERY&orgId=YOUR_ORG_ID
                  </code>
                  <p className="text-sm text-muted-foreground">
                    Search across call transcripts
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Response Format */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Response Format
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  All API responses are JSON objects. Successful responses return a 200 status code:
                </p>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`{
  "success": true,
  "data": {
    // Response data
  }
}`}
                </pre>
                <p className="text-sm text-muted-foreground mt-4">
                  Error responses return appropriate HTTP status codes with error details:
                </p>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto mt-2">
{`{
  "error": "Error message",
  "code": "ERROR_CODE"
}`}
                </pre>
              </CardContent>
            </Card>

            {/* Rate Limits */}
            <Card>
              <CardHeader>
                <CardTitle>Rate Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  API requests are limited to 100 requests per minute per API key. Rate limit headers are included in all responses:
                </p>
                <code className="block bg-muted p-3 rounded-md text-sm mt-2">
                  X-RateLimit-Limit: 100
                  <br />
                  X-RateLimit-Remaining: 95
                  <br />
                  X-RateLimit-Reset: 1609459200
                </code>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
                <p className="text-muted-foreground mb-6">
                  For API support, email us at <a href="mailto:api@fusioncaller.com" className="text-primary hover:underline">api@fusioncaller.com</a>
                </p>
                <a href="/signup">
                  <button className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition">
                    Get API Access
                  </button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

