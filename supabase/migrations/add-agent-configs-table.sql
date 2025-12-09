-- Create phone_numbers table first (required for agent_configs foreign key)
CREATE TABLE IF NOT EXISTS phone_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  provider_phone_id TEXT, -- Vapi/Twilio phone number ID
  friendly_name TEXT, -- e.g., "Main Line", "Backup #1"
  type TEXT DEFAULT 'outbound' CHECK (type IN ('inbound', 'outbound', 'both')),
  daily_limit INTEGER DEFAULT 100,
  calls_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  active BOOLEAN DEFAULT true
);

-- Enable Row Level Security for phone_numbers
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phone_numbers
CREATE POLICY "Users can view phone_numbers for their organizations"
  ON phone_numbers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update phone_numbers for their organizations"
  ON phone_numbers FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can insert phone_numbers for their organizations"
  ON phone_numbers FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Allow service role to bypass RLS for admin operations
CREATE POLICY "Service role can manage phone_numbers"
  ON phone_numbers FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create agent_configs table (replaces vapi_configs for white-labeling)
CREATE TABLE IF NOT EXISTS agent_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Inbound Agent Settings
  inbound_agent_id TEXT, -- Internal reference to Vapi assistant
  inbound_phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
  inbound_enabled BOOLEAN DEFAULT false,
  inbound_greeting TEXT,
  -- Outbound Agent Settings  
  outbound_agent_id TEXT, -- Internal reference to Vapi assistant
  outbound_enabled BOOLEAN DEFAULT false,
  outbound_script_type TEXT DEFAULT 'general',
  -- Schedule Settings (stored as JSONB for flexibility)
  schedule JSONB DEFAULT '{
    "enabledDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "startTime": "09:00",
    "endTime": "17:00",
    "timezone": "America/New_York"
  }'::jsonb,
  -- Daily limits 
  daily_call_limit INTEGER DEFAULT 50,
  calls_made_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(organization_id)
);

-- Enable Row Level Security
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_configs
CREATE POLICY "Users can view agent_configs for their organizations"
  ON agent_configs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update agent_configs for their organizations"
  ON agent_configs FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can insert agent_configs for their organizations"
  ON agent_configs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Allow service role to bypass RLS for admin operations
CREATE POLICY "Service role can manage agent_configs"
  ON agent_configs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_configs_org_id ON agent_configs(organization_id);

