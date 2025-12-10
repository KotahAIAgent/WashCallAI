-- Create campaigns table for outbound calling campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  script_type TEXT DEFAULT 'general',
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  -- Schedule settings (can override org defaults)
  schedule JSONB DEFAULT '{
    "enabledDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "startTime": "09:00",
    "endTime": "17:00",
    "timezone": "America/New_York"
  }'::jsonb,
  daily_limit INTEGER DEFAULT 50,
  -- Stats (denormalized for performance)
  total_contacts INTEGER DEFAULT 0,
  contacts_called INTEGER DEFAULT 0,
  contacts_answered INTEGER DEFAULT 0,
  contacts_interested INTEGER DEFAULT 0
);

-- Create campaign_contacts table for contacts in each campaign
CREATE TABLE IF NOT EXISTS campaign_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Contact info
  name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  business_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  notes TEXT,
  -- Call tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'queued',
    'calling',
    'no_answer',
    'voicemail',
    'answered',
    'interested',
    'not_interested',
    'callback',
    'wrong_number',
    'do_not_call'
  )),
  call_count INTEGER DEFAULT 0,
  last_call_at TIMESTAMPTZ,
  last_call_duration INTEGER,
  last_call_summary TEXT,
  last_call_transcript TEXT,
  last_call_outcome TEXT,
  -- If interested, can convert to inbound lead
  converted_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_organization_id ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign_id ON campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_organization_id ON campaign_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_status ON campaign_contacts(status);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_phone ON campaign_contacts(phone);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "Users can view campaigns for their organizations"
  ON campaigns FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert campaigns for their organizations"
  ON campaigns FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update campaigns for their organizations"
  ON campaigns FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete campaigns for their organizations"
  ON campaigns FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for campaign_contacts
CREATE POLICY "Users can view campaign contacts for their organizations"
  ON campaign_contacts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert campaign contacts for their organizations"
  ON campaign_contacts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update campaign contacts for their organizations"
  ON campaign_contacts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete campaign contacts for their organizations"
  ON campaign_contacts FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

