'use client'

import { signOut } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useOrganization } from '@/contexts/OrganizationContext'
import { MobileSidebar } from './MobileSidebar'
import { GlobalSearch } from './GlobalSearch'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { LogOut, User, Settings } from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'

interface TopbarProps {
  isAdmin?: boolean
  userId?: string
}

export function Topbar({ isAdmin = false, userId }: TopbarProps) {
  const { organization } = useOrganization()
  const [isPending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(() => {
      signOut()
    })
  }

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 glass border-b border-border/50">
      <div className="flex-1 px-6 flex justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <MobileSidebar isAdmin={isAdmin} />
          <h1 className="hidden sm:block text-lg font-semibold text-gray-900 dark:text-white">
            {organization?.name || 'Dashboard'}
          </h1>
        </div>

        {/* Global Search - hidden on mobile */}
        <div className="hidden sm:block flex-1 max-w-xl">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          {organization?.id && userId && (
            <NotificationBell organizationId={organization.id} userId={userId} />
          )}
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Account</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {organization?.name || 'No organization'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/app/settings">
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                disabled={isPending}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isPending ? 'Logging out...' : 'Log out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
