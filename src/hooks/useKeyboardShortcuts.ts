'use client'

import { useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useRouter } from 'next/navigation'

interface KeyboardShortcut {
  keys: string
  description: string
  action: () => void
}

export function useKeyboardShortcuts() {
  const router = useRouter()

  const shortcuts: KeyboardShortcut[] = [
    {
      keys: 'mod+k',
      description: 'Open global search',
      action: () => {
        // Trigger global search - you can customize this
        const searchInput = document.querySelector('[data-global-search]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      },
    },
    {
      keys: 'mod+n',
      description: 'Create new lead/campaign',
      action: () => {
        router.push('/app/campaigns/new')
      },
    },
    {
      keys: 'mod+/',
      description: 'Show keyboard shortcuts',
      action: () => {
        // This will be handled by the ShortcutsDialog component
        const event = new CustomEvent('open-shortcuts-dialog')
        window.dispatchEvent(event)
      },
    },
    {
      keys: 'escape',
      description: 'Close modals/dialogs',
      action: () => {
        // Close any open dialogs
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        document.dispatchEvent(escapeEvent)
      },
    },
  ]

  // Register all shortcuts
  shortcuts.forEach((shortcut) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHotkeys(
      shortcut.keys,
      (e) => {
        e.preventDefault()
        shortcut.action()
      },
      { enableOnFormTags: true }
    )
  })

  return shortcuts
}

export const keyboardShortcutsList = [
  { keys: '⌘K / Ctrl+K', description: 'Open global search' },
  { keys: '⌘N / Ctrl+N', description: 'Create new lead/campaign' },
  { keys: '⌘/ / Ctrl+/', description: 'Show keyboard shortcuts' },
  { keys: 'Esc', description: 'Close modals/dialogs' },
]

