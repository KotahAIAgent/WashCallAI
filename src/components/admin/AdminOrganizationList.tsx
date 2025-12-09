'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Building2, 
  Phone, 
  Bot, 
  CheckCircle2, 
  XCircle,
  ExternalLink 
} from 'lucide-react'

interface Organization {
  id: string
  name: string
  slug: string
  plan: string | null
  created_at: string
  onboarding_completed: boolean | null
  setup_status: string | null
  email: string | null
  agent_configs: {
    inbound_agent_id: string | null
    outbound_agent_id: string | null
    inbound_enabled: boolean
    outbound_enabled: boolean
  }[] | null
  phone_numbers: {
    id: string
    phone_number: string
    type: string
    calls_today: number
    daily_limit: number
  }[] | null
  profiles: {
    id: string
    full_name: string | null
  }[] | null
}

export function AdminOrganizationList({ organizations }: { organizations: Organization[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          All Organizations
        </CardTitle>
        <CardDescription>
          Manage client accounts, agents, and phone numbers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Inbound Agent</TableHead>
              <TableHead>Outbound Agent</TableHead>
              <TableHead>Phone Numbers</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => {
              const config = org.agent_configs?.[0]
              const phoneCount = org.phone_numbers?.length || 0
              
              return (
                <TableRow key={org.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">{org.slug}</p>
                      {org.profiles?.[0]?.full_name && (
                        <p className="text-xs text-muted-foreground">
                          Owner: {org.profiles[0].full_name}
                        </p>
                      )}
                      {org.email && (
                        <p className="text-xs text-muted-foreground">
                          {org.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {org.onboarding_completed ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Onboarded
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Not Onboarded
                        </Badge>
                      )}
                      {org.setup_status && (
                        <Badge 
                          variant="outline" 
                          className={
                            org.setup_status === 'pending' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : org.setup_status === 'in_review'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : org.setup_status === 'setting_up'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : org.setup_status === 'testing'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : org.setup_status === 'ready' || org.setup_status === 'active'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }
                        >
                          {org.setup_status}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {org.plan ? (
                      <Badge variant={org.plan === 'pro' ? 'default' : org.plan === 'growth' ? 'secondary' : 'outline'}>
                        {org.plan}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No plan</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {config?.inbound_agent_id ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          {config.inbound_enabled ? 'Active' : 'Configured'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Not set</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {config?.outbound_agent_id ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          {config.outbound_enabled ? 'Active' : 'Configured'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Not set</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{phoneCount}</span>
                    </div>
                    {org.phone_numbers && org.phone_numbers.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {org.phone_numbers.map(p => p.phone_number).join(', ')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(org.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        
        {organizations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No organizations yet
          </div>
        )}
      </CardContent>
    </Card>
  )
}

