-- Create phone_numbers table if it doesn't exist
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

-- Enable RLS if not already enabled
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view phone_numbers for their organizations" ON phone_numbers;
DROP POLICY IF EXISTS "Users can update phone_numbers for their organizations" ON phone_numbers;

-- Create RLS Policies for phone_numbers
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

-- Allow service role to insert (for admin operations)
DROP POLICY IF EXISTS "Service role can manage phone_numbers" ON phone_numbers;
CREATE POLICY "Service role can manage phone_numbers"
  ON phone_numbers FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

