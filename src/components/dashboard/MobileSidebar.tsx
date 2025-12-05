'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import {
  LayoutDashboard,
  Phone,
  Users,
  PhoneIncoming,
  PhoneOutgoing,
  Settings,
  Shield,
  FolderOpen,
  CreditCard,
  Calendar,
  BarChart3,
  HelpCircle,
  Receipt,
  AlertTriangle,
  Plug,
  Gift,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Calls', href: '/app/calls', icon: Phone },
  { name: 'Inbound Leads', href: '/app/leads', icon: Users },
  { name: 'Calendar', href: '/app/calendar', icon: Calendar },
  { name: 'Campaigns', href: '/app/campaigns', icon: FolderOpen },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
  { name: 'Usage & Disputes', href: '/app/disputes', icon: Receipt },
  { name: 'Inbound AI', href: '/app/inbound-ai', icon: PhoneIncoming },
  { name: 'Outbound AI', href: '/app/outbound-ai', icon: PhoneOutgoing },
  { name: 'Integrations', href: '/app/integrations', icon: Plug },
  { name: 'Referrals', href: '/app/referrals', icon: Gift },
  { name: 'Pricing', href: '/app/pricing', icon: CreditCard },
  { name: 'Settings', href: '/app/settings', icon: Settings },
  { name: 'Help', href: '/app/help', icon: HelpCircle },
]

const adminNavigation = [
  { name: 'Admin Panel', href: '/app/admin', icon: Shield },
  { name: 'Disputes', href: '/app/admin/disputes', icon: AlertTriangle },
]

export function MobileSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  
  const allNavigation = isAdmin ? [...navigation, ...adminNavigation] : navigation

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center flex-shrink-0 px-4 py-4 border-b">
            <span className="text-xl font-bold text-primary">WashCall AI</span>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {allNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isAdminItem = item.href.startsWith('/app/admin')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? isAdminItem 
                        ? 'bg-amber-500 text-white'
                        : 'bg-primary text-white'
                      : isAdminItem
                        ? 'text-amber-700 hover:bg-amber-50 hover:text-amber-800'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
                  )}
                >
                  <Icon
                    className={cn(
                      'mr-3 flex-shrink-0 h-5 w-5',
                      isActive 
                        ? 'text-white' 
                        : isAdminItem 
                          ? 'text-amber-500 group-hover:text-amber-600'
                          : 'text-gray-400 group-hover:text-primary'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}

