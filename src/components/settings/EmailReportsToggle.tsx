'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Mail, FileText, Calendar } from 'lucide-react'
import { updateEmailReportsSettings } from '@/lib/organization/actions'

interface Props {
  organizationId: string
  emailReportsEnabled: boolean
}

export function EmailReportsToggle({ organizationId, emailReportsEnabled }: Props) {
  const [enabled, setEnabled] = useState(emailReportsEnabled)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleToggle(newValue: boolean) {
    setEnabled(newValue)
    setLoading(true)

    const result = await updateEmailReportsSettings(organizationId, newValue)

    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
      setEnabled(!newValue) // Revert on error
    } else {
      toast({
        title: newValue ? 'Reports enabled' : 'Reports disabled',
        description: newValue 
          ? 'You will receive weekly reports every Monday' 
          : 'You will no longer receive weekly reports',
      })
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <Label htmlFor="emailReports" className="text-base font-medium">
              Weekly Email Reports
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive a summary of your performance every Monday
            </p>
          </div>
        </div>
        <Switch
          id="emailReports"
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={loading}
        />
      </div>

      {enabled && (
        <div className="p-4 border rounded-lg space-y-3">
          <h4 className="font-medium text-sm">What's included:</h4>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Call volume &amp; answer rate</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>New leads &amp; conversions</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Appointments booked</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Top performing campaigns</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Reports are sent to your organization email address every Monday at 8:00 AM
          </p>
        </div>
      )}
    </div>
  )
}

