'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { keyboardShortcutsList } from '@/hooks/useKeyboardShortcuts'
import { Keyboard } from 'lucide-react'

export function ShortcutsDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener('open-shortcuts-dialog', handleOpen)
    return () => window.removeEventListener('open-shortcuts-dialog', handleOpen)
  }, [])

  // Also listen for Cmd/Ctrl + /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {keyboardShortcutsList.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
            >
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

