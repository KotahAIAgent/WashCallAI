'use client'

import { useState, useEffect } from 'react'
import { Plus, Tag as TagIcon, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { getTags, createTag, addTagToLead, removeTagFromLead, getLeadTags } from '@/lib/tags/actions'
import { TagBadge } from './TagBadge'

interface Tag {
  id: string
  name: string
  color: string
}

interface TagSelectorProps {
  organizationId: string
  leadId: string
  initialTags?: Tag[]
}

export function TagSelector({ organizationId, leadId, initialTags = [] }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [leadTags, setLeadTags] = useState<Tag[]>(initialTags)
  const [newTagName, setNewTagName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const loadData = async () => {
    setIsLoading(true)
    const [tagsResult, leadTagsResult] = await Promise.all([
      getTags(organizationId),
      getLeadTags(leadId),
    ])
    if (!tagsResult.error) {
      setAllTags(tagsResult.tags || [])
    }
    if (!leadTagsResult.error) {
      setLeadTags(leadTagsResult.tags || [])
    }
    setIsLoading(false)
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    
    setIsCreating(true)
    const result = await createTag(organizationId, newTagName.trim())
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else if (result.tag) {
      setAllTags(prev => [...prev, result.tag!])
      setNewTagName('')
      // Also add to lead
      await handleAddTag(result.tag.id)
    }
    setIsCreating(false)
  }

  const handleAddTag = async (tagId: string) => {
    const result = await addTagToLead(leadId, tagId)
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      const tag = allTags.find(t => t.id === tagId)
      if (tag) {
        setLeadTags(prev => [...prev, tag])
      }
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    const result = await removeTagFromLead(leadId, tagId)
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      setLeadTags(prev => prev.filter(t => t.id !== tagId))
    }
  }

  const leadTagIds = new Set(leadTags.map(t => t.id))
  const availableTags = allTags.filter(t => !leadTagIds.has(t.id))

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {leadTags.map(tag => (
        <TagBadge
          key={tag.id}
          tag={tag}
          size="sm"
          onRemove={() => handleRemoveTag(tag.id)}
        />
      ))}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {/* Create new tag */}
              <div className="flex gap-1">
                <Input
                  placeholder="New tag name..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                  className="h-8 text-sm"
                />
                <Button 
                  size="sm" 
                  className="h-8 px-2"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Available tags */}
              {availableTags.length > 0 && (
                <div className="border-t pt-2">
                  <p className="text-xs text-muted-foreground mb-1.5">Available tags</p>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => handleAddTag(tag.id)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          borderColor: tag.color,
                          color: tag.color,
                        }}
                      >
                        <TagIcon className="h-3 w-3" />
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {availableTags.length === 0 && allTags.length > 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  All tags have been added
                </p>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

