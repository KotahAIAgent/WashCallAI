import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-bold drop-shadow-sm hover:from-indigo-500 hover:via-purple-500 hover:to-pink-400 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105",
        destructive:
          "bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-400 hover:to-red-500 shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 hover:scale-105",
        outline:
          "border-2 border-border bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground hover:border-primary/50 hover:scale-105",
        secondary:
          "bg-secondary/80 backdrop-blur-sm text-secondary-foreground hover:bg-secondary hover:scale-105",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground hover:scale-105",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-full px-4 text-xs",
        lg: "h-13 rounded-full px-8 text-base",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

