'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { deleteCalls } from '@/lib/calls/actions'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface BulkDeleteProps {
  selectedIds: string[]
  onClearSelection: () => void
}

export function BulkDeleteButton({ selectedIds, onClearSelection }: BulkDeleteProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleBulkDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteCalls(selectedIds)
      
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Calls deleted',
          description: `Successfully deleted ${result.deleted || selectedIds.length} call(s).`,
        })
        onClearSelection()
        router.refresh()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete calls',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (selectedIds.length === 0) {
    return null
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="flex items-center gap-2"
      >
        {isDeleting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selectedIds.length})
          </>
        )}
      </Button>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Delete Selected Calls"
        description={`Are you sure you want to delete ${selectedIds.length} call(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    </>
  )
}

