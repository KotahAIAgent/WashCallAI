'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, tourId: 'dashboard' },
  { name: 'Calls', href: '/app/calls', icon: Phone },
  { name: 'Inbound Leads', href: '/app/leads', icon: Users, tourId: 'leads' },
  { name: 'Calendar', href: '/app/calendar', icon: Calendar },
  { name: 'Campaigns', href: '/app/campaigns', icon: FolderOpen, tourId: 'campaigns' },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
  { name: 'Usage & Disputes', href: '/app/disputes', icon: Receipt },
  { name: 'Inbound AI', href: '/app/inbound-ai', icon: PhoneIncoming },
  { name: 'Outbound AI', href: '/app/outbound-ai', icon: PhoneOutgoing },
  { name: 'Integrations', href: '/app/integrations', icon: Plug },
  { name: 'Referrals', href: '/app/referrals', icon: Gift },
  { name: 'Pricing', href: '/app/pricing', icon: CreditCard },
  { name: 'Settings', href: '/app/settings', icon: Settings, tourId: 'settings' },
  { name: 'Help', href: '/app/help', icon: HelpCircle, tourId: 'help' },
]

const adminNavigation = [
  { name: 'Admin Panel', href: '/app/admin', icon: Shield },
  { name: 'Disputes', href: '/app/admin/disputes', icon: AlertTriangle },
]

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()

  const allNavigation = isAdmin ? [...navigation, ...adminNavigation] : navigation

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white dark:bg-gray-800 border-r dark:border-gray-700">
          <div className="flex items-center flex-shrink-0 px-4">
            <span className="text-xl font-bold text-primary">WashCall AI</span>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {allNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                const isAdminItem = item.href.startsWith('/app/admin')
                const tourId = 'tourId' in item ? item.tourId : undefined
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    data-tour={tourId}
                    className={cn(
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? isAdminItem 
                          ? 'bg-amber-500 text-white'
                          : 'bg-primary text-white'
                        : isAdminItem
                          ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-800 dark:hover:text-amber-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary'
                    )}
                  >
                    <Icon
                      className={cn(
                        'mr-3 flex-shrink-0 h-5 w-5',
                        isActive 
                          ? 'text-white' 
                          : isAdminItem 
                            ? 'text-amber-500 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                            : 'text-gray-400 group-hover:text-primary'
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}

