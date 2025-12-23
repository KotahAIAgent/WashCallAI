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
  BarChart3,
  HelpCircle,
  Receipt,
  AlertTriangle,
  Plug,
  Gift,
  Bot,
  Search,
  Radio,
  TrendingUp,
} from 'lucide-react'
import { SidebarCredits } from './SidebarCredits'

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, tourId: 'dashboard' },
  { name: 'Calls', href: '/app/calls', icon: Phone },
  { name: 'Call Intelligence', href: '/app/calls/intelligence', icon: BarChart3 },
  { name: 'Search Transcripts', href: '/app/calls/search', icon: Search },
  { name: 'Live Calls', href: '/app/calls/live', icon: Radio },
  { name: 'Trending Topics', href: '/app/trending-topics', icon: TrendingUp },
  { name: 'Inbound Leads', href: '/app/leads', icon: Users, tourId: 'leads' },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
  { name: 'Usage & Disputes', href: '/app/disputes', icon: Receipt },
  { name: 'Inbound AI', href: '/app/inbound-ai', icon: PhoneIncoming },
  { name: 'Outbound AI', href: '/app/outbound-ai', icon: PhoneOutgoing },
  { name: 'Campaigns', href: '/app/campaigns', icon: FolderOpen, tourId: 'campaigns' },
  { name: 'AI Assistants', href: '/app/assistants', icon: Bot },
  { name: 'Purchase Numbers', href: '/app/phone-numbers', icon: Phone },
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
        <div className="flex flex-col flex-grow pt-6 pb-4 overflow-y-auto glass-strong border-r border-border/30">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 mb-8">
            <div className="relative group cursor-pointer">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 rounded-xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-300 animate-gradient-x bg-[length:200%_100%]"></div>
              {/* Logo container */}
              <div className="relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 shadow-lg shadow-purple-500/30">
                <span className="text-xl font-black text-white tracking-tight drop-shadow-sm">
                  FusionCaller
                </span>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="mt-2 flex-grow flex flex-col">
            <nav className="flex-1 px-3 space-y-1">
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
                      'group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300',
                      isActive
                        ? isAdminItem 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                          : 'bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                        : isAdminItem
                          ? 'text-amber-400/80 hover:bg-amber-500/10 hover:text-amber-300'
                          : 'text-muted-foreground hover:bg-purple-500/10 hover:text-purple-300'
                    )}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/80 rounded-r-full shadow-glow-sm"></div>
                    )}
                    
                    {/* Hover glow effect */}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-pink-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                    )}
                    
                    <Icon
                      className={cn(
                        'mr-3 flex-shrink-0 h-5 w-5 transition-all duration-300',
                        isActive 
                          ? 'text-white drop-shadow-sm' 
                          : isAdminItem 
                            ? 'text-amber-500/70 group-hover:text-amber-400 group-hover:scale-110'
                            : 'text-muted-foreground group-hover:text-purple-400 group-hover:scale-110'
                      )}
                    />
                    <span className={cn(
                      'relative z-10 transition-all duration-300',
                      isActive && 'font-semibold',
                      !isActive && 'group-hover:translate-x-0.5'
                    )}>
                      {item.name}
                    </span>
                    
                    {/* Active item shine effect */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                      </div>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          {/* Credits Section - Bottom Left */}
          <SidebarCredits />
        </div>
      </div>
    </div>
  )
}
