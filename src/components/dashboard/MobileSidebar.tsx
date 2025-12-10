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
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
  { name: 'Usage & Disputes', href: '/app/disputes', icon: Receipt },
  { name: 'Inbound AI', href: '/app/inbound-ai', icon: PhoneIncoming },
  { name: 'Outbound AI', href: '/app/outbound-ai', icon: PhoneOutgoing },
  { name: 'Campaigns', href: '/app/campaigns', icon: FolderOpen },
  { name: 'Integrations (Coming Soon)', href: '/app/integrations', icon: Plug },
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
          <div className="flex items-center flex-shrink-0 px-6 py-6 border-b border-border/50">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-lg blur opacity-50"></div>
              <span className="relative text-xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">FusionCaller</span>
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {allNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isAdminItem = item.href.startsWith('/app/admin')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200',
                    isActive
                      ? isAdminItem 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : isAdminItem
                        ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-50/80 dark:hover:bg-amber-900/20 hover:text-amber-800 dark:hover:text-amber-300 hover:scale-105'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-105'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/90 rounded-r-full"></div>
                  )}
                  <Icon
                    className={cn(
                      'mr-3 flex-shrink-0 h-5 w-5 transition-transform',
                      isActive 
                        ? 'text-white drop-shadow-sm scale-110' 
                        : isAdminItem 
                          ? 'text-amber-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:scale-110'
                          : 'text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-110'
                    )}
                  />
                  <span className={cn(
                    'relative z-10',
                    isActive && 'text-white drop-shadow-sm font-bold'
                  )}>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}

