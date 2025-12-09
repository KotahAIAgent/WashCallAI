'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { 
  Plus, 
  Phone, 
  Users, 
  FolderOpen, 
  Settings,
  Zap
} from 'lucide-react'

export function QuickActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Create New</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/app/campaigns/new">
          <DropdownMenuItem className="cursor-pointer">
            <FolderOpen className="mr-2 h-4 w-4" />
            New Campaign
          </DropdownMenuItem>
        </Link>
        <Link href="/app/leads">
          <DropdownMenuItem className="cursor-pointer">
            <Users className="mr-2 h-4 w-4" />
            View Leads
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Configure</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/app/inbound-ai">
          <DropdownMenuItem className="cursor-pointer">
            <Phone className="mr-2 h-4 w-4" />
            Inbound AI Settings
          </DropdownMenuItem>
        </Link>
        <Link href="/app/outbound-ai">
          <DropdownMenuItem className="cursor-pointer">
            <Zap className="mr-2 h-4 w-4" />
            Outbound AI Settings
          </DropdownMenuItem>
        </Link>
        <Link href="/app/settings">
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Account Settings
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

