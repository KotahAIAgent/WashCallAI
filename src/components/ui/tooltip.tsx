'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
}

interface TooltipProps {
  children: React.ReactNode
}

interface TooltipTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

interface TooltipContentProps {
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  children: React.ReactNode
}

const TooltipContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {},
})

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>
}

export function Tooltip({ children }: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

export function TooltipTrigger({ asChild, children }: TooltipTriggerProps) {
  const { setIsOpen } = React.useContext(TooltipContext)

  const handleMouseEnter = () => setIsOpen(true)
  const handleMouseLeave = () => setIsOpen(false)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    })
  }

  return (
    <span onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
    </span>
  )
}

export function TooltipContent({ className, side = 'top', children }: TooltipContentProps) {
  const { isOpen } = React.useContext(TooltipContext)

  if (!isOpen) return null

  const sideClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  }

  return (
    <div
      className={cn(
        'absolute z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        sideClass[side],
        className
      )}
    >
      {children}
    </div>
  )
}

