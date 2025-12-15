'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Sparkles, Settings, FileText } from 'lucide-react'

export function DoneForYouSection() {
  return (
    <Card className="bg-gradient-to-br from-primary/5 via-blue-500/5 to-purple-500/5 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">DONE FOR YOU</CardTitle>
            <CardDescription className="text-base">
              Most tools give you tech. We give you results.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-muted-foreground mb-4">
            <strong>Other platforms throw you into a dashboard and wish you luck.</strong> FusionCaller is different.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold mb-1 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  We write your AI agent's script
                </div>
                <p className="text-sm text-muted-foreground">
                  Tailored to your offer, your objections, and your outcomes. Not some cookie-cutter chatbot copy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold mb-1 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  We connect your CRM
                </div>
                <p className="text-sm text-muted-foreground">
                  GoHighLevel, Zapier, or anything with webhooks during your onboarding call. Real integrations. Done for you. Live.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-lg font-semibold italic text-center">
            "We don't sell software. We deliver working systems."
          </p>
          <p className="text-center text-muted-foreground mt-2">
            Stop wasting time with tools that hand you homework. Work with FusionCaller — and walk away with a fully operational agent, locked in and ready to go.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

