'use client'

import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ShortcutsDialog } from './ShortcutsDialog'

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts()
  
  return (
    <>
      {children}
      <ShortcutsDialog />
    </>
  )
}

