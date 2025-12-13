import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plug, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Integrations | FusionCaller',
  description: 'Integrations coming soon to FusionCaller.',
}

export default function IntegrationsPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500">
              <Plug className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Integrations Coming Soon</CardTitle>
          <CardDescription className="text-lg mt-2">
            We're working hard to bring you powerful integrations with your favorite tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <p className="text-sm">Stay tuned for updates!</p>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Connect FusionCaller with CRM systems, calendar apps, email marketing tools, and more. 
            We'll notify you as soon as integrations are available.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

