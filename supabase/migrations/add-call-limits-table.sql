-- ============================================
-- CREATE call_limits TABLE
-- ============================================
-- This table tracks calls per lead per day to enforce the 2-call-per-day limit

CREATE TABLE IF NOT EXISTS call_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
  calls_today INTEGER DEFAULT 0,
  last_call_at TIMESTAMPTZ,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(organization_id, lead_id, last_reset_date)
);

-- Enable Row Level Security
ALTER TABLE call_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for call_limits
CREATE POLICY IF NOT EXISTS "Users can view call_limits for their organizations"
  ON call_limits FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert call_limits for their organizations"
  ON call_limits FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update call_limits for their organizations"
  ON call_limits FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_limits_organization_lead ON call_limits(organization_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_call_limits_reset_date ON call_limits(last_reset_date);
CREATE INDEX IF NOT EXISTS idx_call_limits_org_reset ON call_limits(organization_id, last_reset_date);

