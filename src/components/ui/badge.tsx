import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold drop-shadow-sm shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105",
        secondary:
          "border-transparent bg-secondary/80 backdrop-blur-sm text-secondary-foreground hover:bg-secondary hover:scale-105",
        destructive:
          "border-transparent bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/30 hover:scale-105",
        outline: "text-foreground border-2 hover:bg-accent/50 hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

