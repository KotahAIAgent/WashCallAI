'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Tag {
  id: string
  name: string
  color: string
}

interface TagBadgeProps {
  tag: Tag
  onRemove?: () => void
  size?: 'sm' | 'md'
}

export function TagBadge({ tag, onRemove, size = 'md' }: TagBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`${size === 'sm' ? 'text-xs px-1.5 py-0' : 'px-2 py-0.5'} font-normal`}
      style={{
        backgroundColor: `${tag.color}20`,
        borderColor: tag.color,
        color: tag.color,
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-1 hover:opacity-70"
        >
          <X className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </button>
      )}
    </Badge>
  )
}

