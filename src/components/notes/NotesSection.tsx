'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Plus, Pin, Trash2, Edit2, Save, X, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { getNotes, createNote, updateNote, deleteNote, togglePinNote } from '@/lib/notes/actions'

interface Note {
  id: string
  created_at: string
  content: string
  author_name: string | null
  pinned: boolean
}

interface NotesSectionProps {
  organizationId: string
  leadId: string
  authorId?: string
  authorName?: string
}

export function NotesSection({ organizationId, leadId, authorId, authorName }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadNotes()
  }, [leadId])

  const loadNotes = async () => {
    setIsLoading(true)
    const result = await getNotes(leadId)
    if (!result.error) {
      setNotes(result.notes || [])
    }
    setIsLoading(false)
  }

  const handleCreate = async () => {
    if (!newNote.trim()) return
    
    setIsCreating(true)
    const result = await createNote({
      organizationId,
      leadId,
      content: newNote.trim(),
      authorId,
      authorName,
    })
    
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else if (result.note) {
      setNotes(prev => [result.note!, ...prev])
      setNewNote('')
      toast({
        title: 'Note Added',
        description: 'Your note has been saved.',
      })
    }
    setIsCreating(false)
  }

  const handleUpdate = async (noteId: string) => {
    if (!editContent.trim()) return
    
    const result = await updateNote(noteId, editContent.trim())
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      setNotes(prev => prev.map(n => 
        n.id === noteId ? { ...n, content: editContent.trim() } : n
      ))
      setEditingId(null)
      setEditContent('')
    }
  }

  const handleDelete = async (noteId: string) => {
    const result = await deleteNote(noteId)
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      setNotes(prev => prev.filter(n => n.id !== noteId))
      toast({
        title: 'Note Deleted',
        description: 'The note has been removed.',
      })
    }
  }

  const handleTogglePin = async (noteId: string, currentPinned: boolean) => {
    const result = await togglePinNote(noteId, !currentPinned)
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      setNotes(prev => {
        const updated = prev.map(n => 
          n.id === noteId ? { ...n, pinned: !currentPinned } : n
        )
        // Re-sort: pinned first, then by date
        return updated.sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      })
    }
  }

  const startEditing = (note: Note) => {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new note */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleCreate} 
              disabled={!newNote.trim() || isCreating}
              size="sm"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Note
            </Button>
          </div>
        </div>

        {/* Notes list */}
        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notes yet</p>
            <p className="text-sm">Add a note above to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-lg border ${
                  note.pinned ? 'bg-yellow-50 border-yellow-200' : 'bg-muted/30'
                }`}
              >
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(note.id)}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="flex-shrink-0 flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleTogglePin(note.id, note.pinned)}
                        >
                          <Pin className={`h-3.5 w-3.5 ${note.pinned ? 'fill-current text-yellow-600' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => startEditing(note)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      {note.author_name && <span>{note.author_name}</span>}
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

