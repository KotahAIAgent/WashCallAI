'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Lightbulb, Loader2, Send, Sparkles } from 'lucide-react'
import { submitIntegrationRequest } from '@/lib/integrations/actions'

interface RequestIntegrationDialogProps {
  organizationId: string
}

const categories = [
  { value: 'crm', label: 'CRM (Customer Management)' },
  { value: 'calendar', label: 'Calendar & Scheduling' },
  { value: 'communication', label: 'Communication (Slack, Teams)' },
  { value: 'marketing', label: 'Marketing & Email' },
  { value: 'accounting', label: 'Accounting & Invoicing' },
  { value: 'field_service', label: 'Field Service Software' },
  { value: 'other', label: 'Other' },
]

export function RequestIntegrationDialog({ organizationId }: RequestIntegrationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    integrationName: '',
    category: '',
    website: '',
    useCase: '',
    priority: 'nice_to_have',
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.integrationName || !formData.category) {
      toast({
        title: 'Missing information',
        description: 'Please provide the integration name and category',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    const result = await submitIntegrationRequest(organizationId, formData)

    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Request submitted!',
        description: 'Thank you for your feedback. We\'ll review your request.',
      })
      setOpen(false)
      setFormData({
        integrationName: '',
        category: '',
        website: '',
        useCase: '',
        priority: 'nice_to_have',
      })
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Lightbulb className="h-4 w-4 mr-2" />
          Request Integration
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Request an Integration
          </DialogTitle>
          <DialogDescription>
            Tell us what tools you'd like us to integrate with. Your feedback helps us prioritize!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="integrationName">Integration Name *</Label>
            <Input
              id="integrationName"
              placeholder="e.g., QuickBooks, ServiceTitan, Monday.com"
              value={formData.integrationName}
              onChange={(e) => setFormData({ ...formData, integrationName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website (optional)</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="useCase">How would you use it?</Label>
            <Textarea
              id="useCase"
              placeholder="Describe how this integration would help your business..."
              rows={3}
              value={formData.useCase}
              onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>How important is this to you?</Label>
            <div className="flex gap-2">
              {[
                { value: 'nice_to_have', label: 'Nice to have' },
                { value: 'important', label: 'Important' },
                { value: 'critical', label: 'Critical' },
              ].map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={formData.priority === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, priority: option.value })}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

