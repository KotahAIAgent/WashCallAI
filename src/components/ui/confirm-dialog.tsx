'use client'

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
)

const AlertDialogContent = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
)

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
)

const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)

const AlertDialogTitle = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>) => (
  <AlertDialogPrimitive.Title className={cn("text-lg font-semibold", className)} {...props} />
)

const AlertDialogDescription = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>) => (
  <AlertDialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
)

const AlertDialogAction = AlertDialogPrimitive.Action
const AlertDialogCancel = AlertDialogPrimitive.Cancel

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">{cancelLabel}</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant={variant === 'destructive' ? 'destructive' : 'default'} onClick={handleConfirm}>
              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
