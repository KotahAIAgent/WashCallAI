'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { 
  Clock, 
  Search, 
  Wrench, 
  TestTube, 
  CheckCircle2, 
  Zap,
  RefreshCw,
  Send
} from 'lucide-react'
import { updateSetupStatus } from '@/lib/admin/actions'

type SetupStatus = 'pending' | 'in_review' | 'setting_up' | 'testing' | 'ready' | 'active'

interface Organization {
  id: string
  name: string
  email: string | null
  setup_status: SetupStatus | null
  setup_notes: string | null
  plan: string | null
  onboarding_completed: boolean | null
}

interface AdminUpdateStatusProps {
  organizations: Organization[]
}

const STATUS_OPTIONS: { value: SetupStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'pending', label: 'Pending Review', icon: Clock, color: 'bg-amber-100 text-amber-700' },
  { value: 'in_review', label: 'In Review', icon: Search, color: 'bg-blue-100 text-blue-700' },
  { value: 'setting_up', label: 'Setting Up Agent', icon: Wrench, color: 'bg-purple-100 text-purple-700' },
  { value: 'testing', label: 'Testing', icon: TestTube, color: 'bg-indigo-100 text-indigo-700' },
  { value: 'ready', label: 'Ready', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
  { value: 'active', label: 'Active', icon: Zap, color: 'bg-green-100 text-green-700' },
]

export function AdminUpdateStatus({ organizations }: AdminUpdateStatusProps) {
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [status, setStatus] = useState<SetupStatus>('pending')
  const [notes, setNotes] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Filter to only show orgs that have completed onboarding
  const onboardedOrgs = organizations.filter(o => o.onboarding_completed)

  // When org changes, update status and notes
  function handleOrgChange(orgId: string) {
    setSelectedOrg(orgId)
    const org = organizations.find(o => o.id === orgId)
    if (org) {
      setStatus((org.setup_status as SetupStatus) || 'pending')
      setNotes(org.setup_notes || '')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrg) return

    setLoading(true)

    const result = await updateSetupStatus(selectedOrg, status, notes, sendEmail)

    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Status Updated',
        description: sendEmail 
          ? 'Status updated and notification email sent to customer.'
          : 'Status updated successfully.',
      })
      router.refresh()
    }

    setLoading(false)
  }

  const selectedOrgData = organizations.find(o => o.id === selectedOrg)
  const currentStatus = STATUS_OPTIONS.find(s => s.value === status)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Update Setup Status
        </CardTitle>
        <CardDescription>
          Update customer's setup status and optionally notify them
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Organization Select */}
          <div className="space-y-2">
            <Label>Select Organization</Label>
            <Select value={selectedOrg} onValueChange={handleOrgChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an organization..." />
              </SelectTrigger>
              <SelectContent>
                {onboardedOrgs.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No organizations have completed onboarding yet
                  </div>
                ) : (
                  onboardedOrgs.map(org => (
                    <SelectItem key={org.id} value={org.id}>
                      <div className="flex items-center gap-2">
                        <span>{org.name}</span>
                        {org.setup_status && (
                          <Badge variant="outline" className="text-xs">
                            {org.setup_status}
                          </Badge>
                        )}
                        {org.plan && (
                          <Badge className="text-xs bg-green-100 text-green-700">
                            {org.plan}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedOrg && (
            <>
              {/* Current Status Display */}
              {selectedOrgData && (
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p><strong>Email:</strong> {selectedOrgData.email || 'N/A'}</p>
                  <p><strong>Current Plan:</strong> {selectedOrgData.plan || 'None'}</p>
                </div>
              )}

              {/* New Status Select */}
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as SetupStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => {
                      const Icon = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {currentStatus && (
                  <Badge className={`${currentStatus.color} mt-1`}>
                    {currentStatus.label}
                  </Badge>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes about this customer's setup..."
                  rows={3}
                />
              </div>

              {/* Email Toggle */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="sendEmail" className="text-sm">
                  <strong>Send status update email to customer</strong>
                  <p className="text-muted-foreground text-xs">
                    Customer will receive an email about their new status
                  </p>
                </label>
              </div>

              {/* Submit */}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  'Updating...'
                ) : sendEmail ? (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Update & Notify Customer
                  </>
                ) : (
                  'Update Status'
                )}
              </Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

