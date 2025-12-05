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
  plan: string
  created_at: string
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
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={org.plan === 'pro' ? 'default' : org.plan === 'growth' ? 'secondary' : 'outline'}>
                      {org.plan}
                    </Badge>
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

