'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Trash2, Tag, FileDown, CheckSquare, Square } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BulkActionsProps {
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onBulkDelete?: (ids: string[]) => Promise<void>
  onBulkTag?: (ids: string[]) => Promise<void>
  onBulkExport?: (ids: string[]) => Promise<void>
  totalItems: number
}

export function BulkActions({
  selectedIds,
  onSelectionChange,
  onBulkDelete,
  onBulkTag,
  onBulkExport,
  totalItems,
}: BulkActionsProps) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const allSelected = selectedIds.length === totalItems && totalItems > 0
  const someSelected = selectedIds.length > 0 && !allSelected

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      // This would need to be passed from parent with all item IDs
      toast({
        title: 'Select all',
        description: 'Select all functionality requires item IDs from parent',
      })
    }
  }

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedIds.length === 0 || isProcessing) return
    setIsProcessing(true)
    try {
      await onBulkDelete(selectedIds)
      onSelectionChange([])
      toast({ title: 'Deleted', description: `${selectedIds.length} items deleted` })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete items',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkTag = async () => {
    if (!onBulkTag || selectedIds.length === 0 || isProcessing) return
    setIsProcessing(true)
    try {
      await onBulkTag(selectedIds)
      toast({ title: 'Tagged', description: `${selectedIds.length} items tagged` })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to tag items',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkExport = async () => {
    if (!onBulkExport || selectedIds.length === 0 || isProcessing) return
    setIsProcessing(true)
    try {
      await onBulkExport(selectedIds)
      toast({ title: 'Exported', description: `${selectedIds.length} items exported` })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export items',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (selectedIds.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSelectAll}
        className="flex items-center gap-2"
      >
        {allSelected ? (
          <>
            <CheckSquare className="h-4 w-4" />
            Deselect All
          </>
        ) : (
          <>
            <Square className="h-4 w-4" />
            Select All
          </>
        )}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="px-3 py-1">
        {selectedIds.length} selected
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isProcessing}>
            Bulk Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onBulkTag && (
            <DropdownMenuItem 
              onClick={handleBulkTag} 
              className={isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <Tag className="h-4 w-4 mr-2" />
              Add Tag
            </DropdownMenuItem>
          )}
          {onBulkExport && (
            <DropdownMenuItem 
              onClick={handleBulkExport} 
              className={isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export Selected
            </DropdownMenuItem>
          )}
          {onBulkDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleBulkDelete}
                className={`text-red-600 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSelectionChange([])}
        disabled={isProcessing}
      >
        Clear
      </Button>
    </div>
  )
}

