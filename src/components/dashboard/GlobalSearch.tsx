'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Phone, 
  User, 
  FolderOpen, 
  Calendar,
  Command,
  ArrowRight,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SearchResult {
  type: 'lead' | 'call' | 'campaign' | 'appointment'
  id: string
  title: string
  subtitle: string
  href: string
  highlight?: boolean
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  // Search as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
        }
      } catch (error) {
        console.error('Search error:', error)
      }
      setLoading(false)
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      router.push(results[selectedIndex].href)
      setOpen(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'lead': return User
      case 'call': return Phone
      case 'campaign': return FolderOpen
      case 'appointment': return Calendar
      default: return Search
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lead': return 'bg-purple-100 text-purple-700'
      case 'call': return 'bg-green-100 text-green-700'
      case 'campaign': return 'bg-blue-100 text-blue-700'
      case 'appointment': return 'bg-amber-100 text-amber-700'
      default: return 'bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300'
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full md:w-64 justify-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
          <Command className="h-3 w-3" />K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search leads, calls, transcripts, campaigns..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="border-0 focus-visible:ring-0 text-lg h-auto py-0"
                data-global-search
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto">
            {query && results.length === 0 && !loading && (
              <div className="py-12 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No results found for "{query}"</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="p-2">
                {results.map((result, index) => {
                  const Icon = getIcon(result.type)
                  return (
                    <Link
                      key={`${result.type}-${result.id}`}
                      href={result.href}
                      onClick={() => setOpen(false)}
                    >
                      <div
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          index === selectedIndex 
                            ? 'bg-primary/10 text-primary' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.title}</p>
                          <p className={`text-sm truncate ${result.highlight ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                            {result.subtitle}
                            {result.highlight && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Transcript Match
                              </Badge>
                            )}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {result.type}
                        </Badge>
                        {index === selectedIndex && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {!query && (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">Start typing to search across:</p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <Badge variant="outline">Leads</Badge>
                  <Badge variant="outline">Calls</Badge>
                  <Badge variant="outline">Transcripts</Badge>
                  <Badge variant="outline">Campaigns</Badge>
                  <Badge variant="outline">Appointments</Badge>
                </div>
                <p className="text-xs mt-3 text-muted-foreground">
                  Search within call transcripts and summaries
                </p>
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t text-xs text-muted-foreground flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-muted">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted">↵</kbd>
              to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted">esc</kbd>
              to close
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

