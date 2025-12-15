-- Add campaign_type and campaign_config to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS campaign_type TEXT DEFAULT 'company_list' CHECK (campaign_type IN (
  'company_list',
  'past_customers',
  'missing_invoices',
  'estimate_followup',
  'form_leads'
));

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS campaign_config JSONB DEFAULT '{}'::jsonb;

-- Add context fields to campaign_contacts
ALTER TABLE campaign_contacts
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS past_service_id UUID REFERENCES past_services(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS context_data JSONB DEFAULT '{}'::jsonb;

-- Create index for campaign type lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(organization_id, campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_invoice ON campaign_contacts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_estimate ON campaign_contacts(estimate_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_past_service ON campaign_contacts(past_service_id);

