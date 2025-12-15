'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, Building2, Users, Receipt, FileText, FormInput } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export type CampaignType = 
  | 'company_list' 
  | 'past_customers' 
  | 'missing_invoices' 
  | 'estimate_followup' 
  | 'form_leads'

interface CampaignTypeSelectorProps {
  organizationId: string
  onCampaignBuilt?: (campaignId: string) => void
}

export function CampaignTypeSelector({ organizationId, onCampaignBuilt }: CampaignTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<CampaignType | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Form data for different campaign types
  const [companyList, setCompanyList] = useState([{ name: '', phone: '', email: '', address: '', city: '', state: '' }])
  const [pastCustomerConfig, setPastCustomerConfig] = useState({
    discountPercentage: 10,
    discountMessage: '',
    dateRange: { start: '', end: '' },
  })
  const [invoiceConfig, setInvoiceConfig] = useState({
    daysOverdue: 30,
    minAmount: 0,
  })
  const [estimateConfig, setEstimateConfig] = useState({
    status: 'pending' as 'pending' | 'all',
    daysSinceIssue: 7,
  })
  const [formLeadConfig, setFormLeadConfig] = useState({
    dateRange: { start: '', end: '' },
  })

  async function handleBuildCampaign() {
    if (!selectedType) return

    setLoading(true)
    try {
      let config: any = {}

      switch (selectedType) {
        case 'company_list':
          config = { companies: companyList.filter(c => c.name && c.phone) }
          break
        case 'past_customers':
          config = {
            discountPercentage: pastCustomerConfig.discountPercentage,
            discountMessage: pastCustomerConfig.discountMessage || `Special ${pastCustomerConfig.discountPercentage}% discount for returning customers!`,
            ...(pastCustomerConfig.dateRange.start && pastCustomerConfig.dateRange.end ? {
              dateRange: {
                start: new Date(pastCustomerConfig.dateRange.start),
                end: new Date(pastCustomerConfig.dateRange.end),
              },
            } : {}),
          }
          break
        case 'missing_invoices':
          config = {
            daysOverdue: invoiceConfig.daysOverdue,
            minAmount: invoiceConfig.minAmount || undefined,
          }
          break
        case 'estimate_followup':
          config = {
            status: estimateConfig.status,
            daysSinceIssue: estimateConfig.daysSinceIssue,
          }
          break
        case 'form_leads':
          config = {
            ...(formLeadConfig.dateRange.start && formLeadConfig.dateRange.end ? {
              dateRange: {
                start: new Date(formLeadConfig.dateRange.start),
                end: new Date(formLeadConfig.dateRange.end),
              },
            } : {}),
          }
          break
      }

      const response = await fetch('/api/campaigns/build-from-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          campaignType: selectedType,
          config,
        }),
      })

      const result = await response.json()

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'Campaign built successfully!',
        })
        if (onCampaignBuilt) {
          onCampaignBuilt(result.campaignId)
        } else {
          router.push(`/app/campaigns/${result.campaignId}`)
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to build campaign',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  function addCompany() {
    setCompanyList([...companyList, { name: '', phone: '', email: '', address: '', city: '', state: '' }])
  }

  function removeCompany(index: number) {
    setCompanyList(companyList.filter((_, i) => i !== index))
  }

  function updateCompany(index: number, field: string, value: string) {
    const updated = [...companyList]
    updated[index] = { ...updated[index], [field]: value }
    setCompanyList(updated)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Campaign Type</Label>
        <RadioGroup value={selectedType || ''} onValueChange={(value) => setSelectedType(value as CampaignType)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedType('company_list')}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="company_list" id="company_list" />
                  <Building2 className="h-5 w-5" />
                  <CardTitle className="text-base">Company List</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Call a list of companies manually added
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedType('past_customers')}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="past_customers" id="past_customers" />
                  <Users className="h-5 w-5" />
                  <CardTitle className="text-base">Past Customers</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Call previous customers with discount offers
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedType('missing_invoices')}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="missing_invoices" id="missing_invoices" />
                  <Receipt className="h-5 w-5" />
                  <CardTitle className="text-base">Missing Invoices</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Follow up on overdue invoices
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedType('estimate_followup')}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="estimate_followup" id="estimate_followup" />
                  <FileText className="h-5 w-5" />
                  <CardTitle className="text-base">Estimate Follow-up</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Follow up on pending estimates
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedType('form_leads')}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="form_leads" id="form_leads" />
                  <FormInput className="h-5 w-5" />
                  <CardTitle className="text-base">Form Leads</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Call leads from form submissions
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </RadioGroup>
      </div>

      {/* Type-specific configuration */}
      {selectedType === 'company_list' && (
        <Card>
          <CardHeader>
            <CardTitle>Add Companies</CardTitle>
            <CardDescription>Enter company information to call</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {companyList.map((company, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={company.name}
                    onChange={(e) => updateCompany(index, 'name', e.target.value)}
                    placeholder="ABC Company"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={company.phone}
                    onChange={(e) => updateCompany(index, 'phone', e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={company.email}
                    onChange={(e) => updateCompany(index, 'email', e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={company.address}
                    onChange={(e) => updateCompany(index, 'address', e.target.value)}
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={company.city}
                    onChange={(e) => updateCompany(index, 'city', e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={company.state}
                    onChange={(e) => updateCompany(index, 'state', e.target.value)}
                    placeholder="NY"
                  />
                </div>
                {companyList.length > 1 && (
                  <div className="md:col-span-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCompany(index)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addCompany}>
              Add Another Company
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedType === 'past_customers' && (
        <Card>
          <CardHeader>
            <CardTitle>Past Customer Campaign Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Discount Percentage</Label>
              <Input
                type="number"
                value={pastCustomerConfig.discountPercentage}
                onChange={(e) =>
                  setPastCustomerConfig((prev) => ({
                    ...prev,
                    discountPercentage: parseInt(e.target.value) || 10,
                  }))
                }
                min={0}
                max={100}
              />
            </div>
            <div>
              <Label>Discount Message (Optional)</Label>
              <Input
                value={pastCustomerConfig.discountMessage}
                onChange={(e) =>
                  setPastCustomerConfig((prev) => ({
                    ...prev,
                    discountMessage: e.target.value,
                  }))
                }
                placeholder="Special discount for returning customers!"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date (Optional)</Label>
                <Input
                  type="date"
                  value={pastCustomerConfig.dateRange.start}
                  onChange={(e) =>
                    setPastCustomerConfig((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <Label>End Date (Optional)</Label>
                <Input
                  type="date"
                  value={pastCustomerConfig.dateRange.end}
                  onChange={(e) =>
                    setPastCustomerConfig((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedType === 'missing_invoices' && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Campaign Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Days Overdue</Label>
              <Input
                type="number"
                value={invoiceConfig.daysOverdue}
                onChange={(e) =>
                  setInvoiceConfig((prev) => ({
                    ...prev,
                    daysOverdue: parseInt(e.target.value) || 30,
                  }))
                }
                min={1}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only include invoices overdue by this many days or more
              </p>
            </div>
            <div>
              <Label>Minimum Amount (Optional)</Label>
              <Input
                type="number"
                value={invoiceConfig.minAmount}
                onChange={(e) =>
                  setInvoiceConfig((prev) => ({
                    ...prev,
                    minAmount: parseFloat(e.target.value) || 0,
                  }))
                }
                min={0}
                step="0.01"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {selectedType === 'estimate_followup' && (
        <Card>
          <CardHeader>
            <CardTitle>Estimate Follow-up Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Estimate Status</Label>
              <Select
                value={estimateConfig.status}
                onValueChange={(value: any) =>
                  setEstimateConfig((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending Only</SelectItem>
                  <SelectItem value="all">All Estimates</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Days Since Issue</Label>
              <Input
                type="number"
                value={estimateConfig.daysSinceIssue}
                onChange={(e) =>
                  setEstimateConfig((prev) => ({
                    ...prev,
                    daysSinceIssue: parseInt(e.target.value) || 7,
                  }))
                }
                min={1}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only include estimates issued this many days ago or more
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedType === 'form_leads' && (
        <Card>
          <CardHeader>
            <CardTitle>Form Lead Campaign Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date (Optional)</Label>
                <Input
                  type="date"
                  value={formLeadConfig.dateRange.start}
                  onChange={(e) =>
                    setFormLeadConfig((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <Label>End Date (Optional)</Label>
                <Input
                  type="date"
                  value={formLeadConfig.dateRange.end}
                  onChange={(e) =>
                    setFormLeadConfig((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedType && (
        <Button
          onClick={handleBuildCampaign}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Building Campaign...
            </>
          ) : (
            'Build Campaign'
          )}
        </Button>
      )}
    </div>
  )
}

