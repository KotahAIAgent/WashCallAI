import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  actionOnClick?: () => void
  children?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-6">
        {/* Decorative circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-primary/5 animate-pulse" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10" />
        </div>
        <div className="relative w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <Icon className="h-8 w-8 text-primary" />
        </div>
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      
      {children}
      
      {actionLabel && (actionHref || actionOnClick) && (
        actionHref ? (
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        ) : (
          <Button onClick={actionOnClick}>{actionLabel}</Button>
        )
      )}
    </div>
  )
}

// Pre-built empty states for common scenarios
export function EmptyLeads() {
  return (
    <EmptyState
      icon={require('lucide-react').Users}
      title="No leads yet"
      description="When people call your business, leads will appear here automatically."
      actionLabel="Configure Inbound AI"
      actionHref="/app/inbound-ai"
    />
  )
}

export function EmptyCalls() {
  return (
    <EmptyState
      icon={require('lucide-react').Phone}
      title="No calls recorded"
      description="Your call history will appear here once your AI starts handling calls."
      actionLabel="View Setup Guide"
      actionHref="/app/help"
    />
  )
}

export function EmptyCampaigns() {
  return (
    <EmptyState
      icon={require('lucide-react').FolderOpen}
      title="No campaigns yet"
      description="Create your first outbound campaign to start reaching potential customers."
      actionLabel="Create Campaign"
      actionHref="/app/campaigns/new"
    />
  )
}

export function EmptyAppointments() {
  return (
    <EmptyState
      icon={require('lucide-react').Calendar}
      title="No upcoming appointments"
      description="When your AI books appointments, they'll appear here."
    />
  )
}

export function EmptyActivity() {
  return (
    <EmptyState
      icon={require('lucide-react').Activity}
      title="No recent activity"
      description="Your recent calls, leads, and appointments will appear here."
    />
  )
}

