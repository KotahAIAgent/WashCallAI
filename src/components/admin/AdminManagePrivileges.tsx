'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { 
  Crown, 
  Calendar,
  X,
  CheckCircle2,
  Zap,
  Star,
  Shield,
  Infinity
} from 'lucide-react'
import { 
  adminGrantPlanUpgrade, 
  adminRevokePlanUpgrade,
  adminGrantPrivileges,
  adminRevokePrivileges,
  getEffectivePlan
} from '@/lib/admin/actions'

interface Organization {
  id: string
  name: string
  email: string | null
  plan: string | null
  admin_granted_plan: string | null
  admin_granted_plan_expires_at: string | null
  admin_granted_plan_notes: string | null
  admin_privileges: any
  admin_privileges_notes: string | null
}

interface AdminManagePrivilegesProps {
  organizations: Organization[]
  adminEmail: string
}

const PLAN_OPTIONS = [
  { value: 'starter', label: 'Starter', icon: Zap, color: 'bg-blue-100 text-blue-700' },
  { value: 'growth', label: 'Growth', icon: Star, color: 'bg-purple-100 text-purple-700' },
  { value: 'pro', label: 'Pro', icon: Crown, color: 'bg-amber-100 text-amber-700' },
]

export function AdminManagePrivileges({ organizations, adminEmail }: AdminManagePrivilegesProps) {
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'plan' | 'privileges'>('plan')
  
  // Plan upgrade state
  const [plan, setPlan] = useState<'starter' | 'growth' | 'pro'>('starter')
  const [planExpiresAt, setPlanExpiresAt] = useState<string>('')
  const [planNotes, setPlanNotes] = useState('')
  const [planLoading, setPlanLoading] = useState(false)
  
  // Privileges state
  const [unlimitedCalls, setUnlimitedCalls] = useState(false)
  const [bypassLimits, setBypassLimits] = useState(false)
  const [unlimitedCampaigns, setUnlimitedCampaigns] = useState(false)
  const [privilegesNotes, setPrivilegesNotes] = useState('')
  const [privilegesLoading, setPrivilegesLoading] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  const selectedOrgData = organizations.find(o => o.id === selectedOrg)
  const effectivePlan = selectedOrgData ? getEffectivePlan(selectedOrgData) : null
  const hasAdminPlan = selectedOrgData?.admin_granted_plan && 
    (!selectedOrgData.admin_granted_plan_expires_at || 
     new Date(selectedOrgData.admin_granted_plan_expires_at) > new Date())

  // When org changes, load current privileges
  function handleOrgChange(orgId: string) {
    setSelectedOrg(orgId)
    const org = organizations.find(o => o.id === orgId)
    if (org) {
      // Load plan upgrade info
      if (org.admin_granted_plan) {
        setPlan(org.admin_granted_plan as 'starter' | 'growth' | 'pro')
        setPlanExpiresAt(
          org.admin_granted_plan_expires_at 
            ? new Date(org.admin_granted_plan_expires_at).toISOString().slice(0, 16)
            : ''
        )
        setPlanNotes(org.admin_granted_plan_notes || '')
      } else {
        setPlan('starter')
        setPlanExpiresAt('')
        setPlanNotes('')
      }

      // Load privileges
      const privileges = org.admin_privileges || {}
      setUnlimitedCalls(privileges.unlimited_calls === true)
      setBypassLimits(privileges.bypass_limits === true)
      setUnlimitedCampaigns(privileges.unlimited_campaigns === true)
      setPrivilegesNotes(org.admin_privileges_notes || '')
    }
  }

  async function handleGrantPlan(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrg) return

    setPlanLoading(true)

    const expiresAt = planExpiresAt ? new Date(planExpiresAt) : null
    const result = await adminGrantPlanUpgrade(
      selectedOrg,
      plan,
      expiresAt,
      planNotes,
      adminEmail
    )

    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Plan Upgrade Granted',
        description: result.message || `Granted ${plan} plan to organization`,
      })
      router.refresh()
    }

    setPlanLoading(false)
  }

  async function handleRevokePlan() {
    if (!selectedOrg) return

    setPlanLoading(true)

    const result = await adminRevokePlanUpgrade(selectedOrg, adminEmail)

    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Plan Upgrade Revoked',
        description: 'Admin-granted plan has been removed',
      })
      router.refresh()
    }

    setPlanLoading(false)
  }

  async function handleGrantPrivileges(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrg) return

    setPrivilegesLoading(true)

    const privileges: any = {}
    if (unlimitedCalls) privileges.unlimited_calls = true
    if (bypassLimits) privileges.bypass_limits = true
    if (unlimitedCampaigns) privileges.unlimited_campaigns = true

    const result = await adminGrantPrivileges(
      selectedOrg,
      privileges,
      privilegesNotes,
      adminEmail
    )

    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Privileges Granted',
        description: 'Special privileges have been granted to this organization',
      })
      router.refresh()
    }

    setPrivilegesLoading(false)
  }

  async function handleRevokePrivileges() {
    if (!selectedOrg) return

    setPrivilegesLoading(true)

    const result = await adminRevokePrivileges(selectedOrg, adminEmail)

    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Privileges Revoked',
        description: 'All special privileges have been removed',
      })
      router.refresh()
    }

    setPrivilegesLoading(false)
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Manage Organization Privileges
        </CardTitle>
        <CardDescription>
          Grant temporary plan upgrades or special privileges to organizations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Organization Select */}
          <div className="space-y-2">
            <Label>Select Organization</Label>
            <Select value={selectedOrg} onValueChange={handleOrgChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an organization..." />
              </SelectTrigger>
              <SelectContent>
                {organizations.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No organizations found
                  </div>
                ) : (
                  organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>
                      <div className="flex items-center gap-2">
                        <span>{org.name}</span>
                        {org.plan && (
                          <Badge variant="outline" className="text-xs">
                            {org.plan}
                          </Badge>
                        )}
                        {org.admin_granted_plan && (
                          <Badge className="text-xs bg-amber-100 text-amber-700">
                            Admin: {org.admin_granted_plan}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedOrg && selectedOrgData && (
            <>
              {/* Current Status Display */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span><strong>Email:</strong> {selectedOrgData.email || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span><strong>Regular Plan:</strong> {selectedOrgData.plan || 'None'}</span>
                  <span><strong>Effective Plan:</strong> {effectivePlan || 'None'}</span>
                </div>
                {hasAdminPlan && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Crown className="h-4 w-4" />
                      <span><strong>Admin-Granted Plan:</strong> {selectedOrgData.admin_granted_plan}</span>
                    </div>
                    {selectedOrgData.admin_granted_plan_expires_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {new Date(selectedOrgData.admin_granted_plan_expires_at).toLocaleString()}
                      </p>
                    )}
                    {selectedOrgData.admin_granted_plan_notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Notes: {selectedOrgData.admin_granted_plan_notes}
                      </p>
                    )}
                  </div>
                )}
                {selectedOrgData.admin_privileges && Object.keys(selectedOrgData.admin_privileges).length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-purple-700">
                      <Shield className="h-4 w-4" />
                      <span><strong>Special Privileges:</strong></span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(selectedOrgData.admin_privileges).map(([key, value]) => 
                        value === true && (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key.replace(/_/g, ' ')}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b">
                <button
                  type="button"
                  onClick={() => setActiveTab('plan')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'plan'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Plan Upgrade
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('privileges')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'privileges'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Special Privileges
                </button>
              </div>

              {/* Plan Upgrade Tab */}
              {activeTab === 'plan' && (
                <form onSubmit={handleGrantPlan} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Plan to Grant</Label>
                    <Select value={plan} onValueChange={(v) => setPlan(v as 'starter' | 'growth' | 'pro')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAN_OPTIONS.map(option => {
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
                  </div>

                  <div className="space-y-2">
                    <Label>Expiration Date (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={planExpiresAt}
                      onChange={(e) => setPlanExpiresAt(e.target.value)}
                      placeholder="Leave empty for no expiration"
                    />
                    <p className="text-xs text-muted-foreground">
                      If set, the plan upgrade will automatically expire on this date
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={planNotes}
                      onChange={(e) => setPlanNotes(e.target.value)}
                      placeholder="Why is this plan being granted? (internal notes)"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={planLoading} className="flex-1">
                      {planLoading ? 'Granting...' : hasAdminPlan ? 'Update Plan Upgrade' : 'Grant Plan Upgrade'}
                    </Button>
                    {hasAdminPlan && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleRevokePlan}
                        disabled={planLoading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </form>
              )}

              {/* Privileges Tab */}
              {activeTab === 'privileges' && (
                <form onSubmit={handleGrantPrivileges} className="space-y-4">
                  <div className="space-y-3">
                    <Label>Select Privileges</Label>
                    
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Checkbox
                        id="unlimited_calls"
                        checked={unlimitedCalls}
                        onCheckedChange={(checked) => setUnlimitedCalls(checked === true)}
                      />
                      <div className="flex-1">
                        <label htmlFor="unlimited_calls" className="text-sm font-medium cursor-pointer">
                          Unlimited Calls
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Remove all call limits (inbound and outbound)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Checkbox
                        id="bypass_limits"
                        checked={bypassLimits}
                        onCheckedChange={(checked) => setBypassLimits(checked === true)}
                      />
                      <div className="flex-1">
                        <label htmlFor="bypass_limits" className="text-sm font-medium cursor-pointer">
                          Bypass All Limits
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Full access regardless of subscription status
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Checkbox
                        id="unlimited_campaigns"
                        checked={unlimitedCampaigns}
                        onCheckedChange={(checked) => setUnlimitedCampaigns(checked === true)}
                      />
                      <div className="flex-1">
                        <label htmlFor="unlimited_campaigns" className="text-sm font-medium cursor-pointer">
                          Unlimited Campaigns
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Remove campaign limits
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={privilegesNotes}
                      onChange={(e) => setPrivilegesNotes(e.target.value)}
                      placeholder="Why are these privileges being granted? (internal notes)"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={privilegesLoading} className="flex-1">
                      {privilegesLoading ? 'Granting...' : 'Grant Privileges'}
                    </Button>
                    {selectedOrgData.admin_privileges && Object.keys(selectedOrgData.admin_privileges).length > 0 && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleRevokePrivileges}
                        disabled={privilegesLoading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Revoke All
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

