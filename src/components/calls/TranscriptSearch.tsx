'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, FileText, Clock } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface SearchResult {
  id: string
  direction: 'inbound' | 'outbound'
  status: string
  created_at: string
  transcript: string
  summary: string | null
  lead_id: string | null
  from_number: string | null
  to_number: string | null
  highlighted_transcript?: string
}

export function TranscriptSearch({ organizationId }: { organizationId: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const response = await fetch(`/api/calls/search-transcripts?q=${encodeURIComponent(query)}&orgId=${organizationId}`)
      const data = await response.json()
      
      if (data.success) {
        setResults(data.results || [])
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search transcripts (e.g., 'pricing question', 'interested in service')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </form>

      {searched && (
        <div className="text-sm text-muted-foreground">
          Found {results.length} result{results.length !== 1 ? 's' : ''}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result) => (
            <Card key={result.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={result.direction === 'inbound' ? 'default' : 'secondary'}>
                        {result.direction}
                      </Badge>
                      <Badge variant="outline">{result.status}</Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(result.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    {result.lead_id && (
                      <Link href={`/app/leads/${result.lead_id}`}>
                        <Button variant="ghost" size="sm">
                          View Lead
                        </Button>
                      </Link>
                    )}
                  </div>

                  {result.summary && (
                    <div className="text-sm">
                      <span className="font-medium">Summary: </span>
                      <span className="text-muted-foreground">{result.summary}</span>
                    </div>
                  )}

                  <div className="text-sm">
                    <div className="font-medium mb-1 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Transcript Excerpt:
                    </div>
                    <div className="bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs font-sans">
                        {result.highlighted_transcript || result.transcript.substring(0, 500)}
                        {result.transcript.length > 500 && '...'}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searched && results.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No results found for "{query}"</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try different keywords or check your spelling
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

