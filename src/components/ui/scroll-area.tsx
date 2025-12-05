'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <div
      className={cn(
        'relative overflow-auto',
        // Custom scrollbar styling
        '[&::-webkit-scrollbar]:w-2',
        '[&::-webkit-scrollbar-track]:bg-transparent',
        '[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20',
        '[&::-webkit-scrollbar-thumb]:rounded-full',
        '[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

