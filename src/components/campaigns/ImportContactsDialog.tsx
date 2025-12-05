'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { importContacts } from '@/lib/campaigns/actions'
import { useToast } from '@/hooks/use-toast'
import { Upload, Loader2, FileSpreadsheet, CheckCircle2, AlertTriangle } from 'lucide-react'

interface ParsedContact {
  name?: string
  phone: string
  email?: string
  businessName?: string
  address?: string
  city?: string
  state?: string
  notes?: string
}

export function ImportContactsDialog({
  campaignId,
  organizationId,
}: {
  campaignId: string
  organizationId: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  function parseCSV(text: string): ParsedContact[] {
    const lines = text.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row')
    }

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
    
    // Find column indices
    const phoneIndex = headers.findIndex(h => 
      h.includes('phone') || h.includes('tel') || h.includes('mobile') || h.includes('number')
    )
    const nameIndex = headers.findIndex(h => 
      h.includes('name') && !h.includes('business')
    )
    const businessIndex = headers.findIndex(h => 
      h.includes('business') || h.includes('company') || h.includes('organization')
    )
    const emailIndex = headers.findIndex(h => h.includes('email'))
    const addressIndex = headers.findIndex(h => h.includes('address') || h.includes('street'))
    const cityIndex = headers.findIndex(h => h.includes('city'))
    const stateIndex = headers.findIndex(h => h.includes('state'))
    const notesIndex = headers.findIndex(h => h.includes('note'))

    if (phoneIndex === -1) {
      throw new Error('CSV must have a phone/tel/mobile column')
    }

    const contacts: ParsedContact[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length === 0) continue

      const phone = cleanPhone(values[phoneIndex] || '')
      if (!phone) continue

      contacts.push({
        phone,
        name: values[nameIndex]?.trim() || undefined,
        businessName: values[businessIndex]?.trim() || undefined,
        email: values[emailIndex]?.trim() || undefined,
        address: values[addressIndex]?.trim() || undefined,
        city: values[cityIndex]?.trim() || undefined,
        state: values[stateIndex]?.trim() || undefined,
        notes: values[notesIndex]?.trim() || undefined,
      })
    }

    return contacts
  }

  function parseCSVLine(line: string): string[] {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    return values
  }

  function cleanPhone(phone: string): string {
    // Remove all non-numeric characters except +
    const cleaned = phone.replace(/[^\d+]/g, '')
    if (!cleaned || cleaned.length < 10) return ''
    
    // Add + if not present and starts with 1
    if (!cleaned.startsWith('+') && cleaned.length === 10) {
      return '+1' + cleaned
    }
    if (!cleaned.startsWith('+') && cleaned.length === 11 && cleaned.startsWith('1')) {
      return '+' + cleaned
    }
    return cleaned.startsWith('+') ? cleaned : '+' + cleaned
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setParseError(null)
    setParsedContacts([])

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const contacts = parseCSV(text)
        if (contacts.length === 0) {
          setParseError('No valid contacts found in CSV')
        } else {
          setParsedContacts(contacts)
        }
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Failed to parse CSV')
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (parsedContacts.length === 0) return

    setLoading(true)
    const result = await importContacts(campaignId, organizationId, parsedContacts)
    
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ 
        title: 'Import successful', 
        description: `${result.imported} contacts imported` 
      })
      setOpen(false)
      setParsedContacts([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        setParsedContacts([])
        setParseError(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with contacts to add to this campaign
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Format Instructions */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              CSV Format
            </h4>
            <p className="text-sm text-muted-foreground mb-2">
              Your CSV should have headers. Required: <code className="bg-background px-1 rounded">phone</code>
            </p>
            <p className="text-sm text-muted-foreground">
              Optional columns: <code className="bg-background px-1 rounded">name</code>, 
              <code className="bg-background px-1 rounded ml-1">business</code>, 
              <code className="bg-background px-1 rounded ml-1">email</code>, 
              <code className="bg-background px-1 rounded ml-1">city</code>, 
              <code className="bg-background px-1 rounded ml-1">state</code>
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
            />
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{parseError}</span>
            </div>
          )}

          {/* Preview */}
          {parsedContacts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">{parsedContacts.length} contacts found</span>
              </div>
              
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">Name/Business</th>
                      <th className="text-left p-2">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedContacts.slice(0, 10).map((contact, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">
                          {contact.name || contact.businessName || '-'}
                        </td>
                        <td className="p-2 font-mono">{contact.phone}</td>
                      </tr>
                    ))}
                    {parsedContacts.length > 10 && (
                      <tr className="border-t">
                        <td colSpan={2} className="p-2 text-center text-muted-foreground">
                          ... and {parsedContacts.length - 10} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={loading || parsedContacts.length === 0}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import {parsedContacts.length} Contacts
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

