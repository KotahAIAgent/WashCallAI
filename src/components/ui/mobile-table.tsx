'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

interface MobileTableItem {
  id: string
  [key: string]: any
}

interface MobileTableColumn {
  key: string
  label: string
  render?: (item: MobileTableItem) => React.ReactNode
  className?: string
}

interface MobileTableProps {
  items: MobileTableItem[]
  columns: MobileTableColumn[]
  getItemHref?: (item: MobileTableItem) => string
  emptyMessage?: string
  emptyIcon?: React.ReactNode
}

export function MobileTable({
  items,
  columns,
  getItemHref,
  emptyMessage = 'No items found',
  emptyIcon,
}: MobileTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyIcon}
        <p className="text-sm mt-2">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const content = (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
          >
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 space-y-3">
                {columns.map((column) => {
                  const value = column.render
                    ? column.render(item)
                    : item[column.key]

                  return (
                    <div key={column.key} className={column.className}>
                      <div className="text-xs text-muted-foreground mb-1">
                        {column.label}
                      </div>
                      <div className="text-sm font-medium">{value || 'N/A'}</div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>
        )

        if (getItemHref) {
          return (
            <Link key={item.id} href={getItemHref(item)} className="block">
              {content}
            </Link>
          )
        }

        return content
      })}
    </div>
  )
}

