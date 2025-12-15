-- Create crm_integrations table for storing CRM connection configurations
CREATE TABLE IF NOT EXISTS crm_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- CRM identification
  crm_type TEXT NOT NULL CHECK (crm_type IN ('markate', 'salesforce', 'hubspot', 'pipedrive', 'zoho', 'custom')),
  display_name TEXT, -- User-friendly name for custom CRMs
  
  -- API connection details
  api_endpoint TEXT NOT NULL,
  api_key TEXT, -- Encrypted/stored securely
  api_secret TEXT, -- For OAuth flows
  auth_type TEXT DEFAULT 'api_key' CHECK (auth_type IN ('api_key', 'oauth2', 'basic')),
  
  -- Connection status
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT, -- 'success', 'failed', 'in_progress'
  last_sync_error TEXT,
  
  -- Configuration (CRM-specific settings stored as JSONB)
  config JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  active BOOLEAN DEFAULT true,
  
  UNIQUE(organization_id, crm_type, display_name)
);

-- Create invoices table (synced from CRM or manually entered)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Invoice identification
  invoice_number TEXT NOT NULL,
  crm_invoice_id TEXT, -- External CRM ID
  crm_integration_id UUID REFERENCES crm_integrations(id) ON DELETE SET NULL,
  
  -- Customer/Lead reference
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  
  -- Invoice details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  issue_date DATE NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  paid_date DATE,
  
  -- Additional data
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(organization_id, invoice_number)
);

-- Create estimates table (synced from CRM or manually entered)
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Estimate identification
  estimate_number TEXT NOT NULL,
  crm_estimate_id TEXT, -- External CRM ID
  crm_integration_id UUID REFERENCES crm_integrations(id) ON DELETE SET NULL,
  
  -- Customer/Lead reference
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  
  -- Estimate details
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  issue_date DATE NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  accepted_date DATE,
  
  -- Service details
  service_type TEXT,
  service_description TEXT,
  property_address TEXT,
  property_type TEXT,
  
  -- Additional data
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(organization_id, estimate_number)
);

-- Create past_services table (historical service records)
CREATE TABLE IF NOT EXISTS past_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Service identification
  service_number TEXT,
  crm_service_id TEXT, -- External CRM ID
  crm_integration_id UUID REFERENCES crm_integrations(id) ON DELETE SET NULL,
  
  -- Customer/Lead reference
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  
  -- Service details
  service_type TEXT NOT NULL,
  service_date DATE NOT NULL,
  amount DECIMAL(10, 2),
  property_address TEXT,
  property_type TEXT,
  
  -- Additional data
  description TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_crm_integrations_organization ON crm_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_integrations_type ON crm_integrations(organization_id, crm_type);
CREATE INDEX IF NOT EXISTS idx_invoices_organization ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_lead ON invoices(lead_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(organization_id, due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_estimates_organization ON estimates(organization_id);
CREATE INDEX IF NOT EXISTS idx_estimates_lead ON estimates(lead_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_past_services_organization ON past_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_past_services_lead ON past_services(lead_id);
CREATE INDEX IF NOT EXISTS idx_past_services_customer ON past_services(organization_id, customer_phone);

-- Enable RLS
ALTER TABLE crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE past_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_integrations
DROP POLICY IF EXISTS "Users can view CRM integrations for their organizations" ON crm_integrations;
CREATE POLICY "Users can view CRM integrations for their organizations"
  ON crm_integrations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert CRM integrations for their organizations" ON crm_integrations;
CREATE POLICY "Users can insert CRM integrations for their organizations"
  ON crm_integrations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can update CRM integrations for their organizations" ON crm_integrations;
CREATE POLICY "Users can update CRM integrations for their organizations"
  ON crm_integrations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can delete CRM integrations for their organizations" ON crm_integrations;
CREATE POLICY "Users can delete CRM integrations for their organizations"
  ON crm_integrations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for invoices
DROP POLICY IF EXISTS "Users can view invoices for their organizations" ON invoices;
CREATE POLICY "Users can view invoices for their organizations"
  ON invoices FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert invoices for their organizations" ON invoices;
CREATE POLICY "Users can insert invoices for their organizations"
  ON invoices FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update invoices for their organizations" ON invoices;
CREATE POLICY "Users can update invoices for their organizations"
  ON invoices FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for estimates
DROP POLICY IF EXISTS "Users can view estimates for their organizations" ON estimates;
CREATE POLICY "Users can view estimates for their organizations"
  ON estimates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert estimates for their organizations" ON estimates;
CREATE POLICY "Users can insert estimates for their organizations"
  ON estimates FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update estimates for their organizations" ON estimates;
CREATE POLICY "Users can update estimates for their organizations"
  ON estimates FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for past_services
DROP POLICY IF EXISTS "Users can view past_services for their organizations" ON past_services;
CREATE POLICY "Users can view past_services for their organizations"
  ON past_services FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert past_services for their organizations" ON past_services;
CREATE POLICY "Users can insert past_services for their organizations"
  ON past_services FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update past_services for their organizations" ON past_services;
CREATE POLICY "Users can update past_services for their organizations"
  ON past_services FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

