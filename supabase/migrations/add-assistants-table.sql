-- Create assistants table for user-created assistants with custom settings
CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  assistant_id TEXT, -- Internal provider assistant ID
  type TEXT NOT NULL CHECK (type IN ('inbound', 'outbound')),
  -- Settings stored as JSONB for flexibility
  settings JSONB DEFAULT '{}'::jsonb, -- Voice, model, prompts, etc.
  active BOOLEAN DEFAULT true,
  UNIQUE(organization_id, name, type)
);

-- Create index for faster lookups (drop if exists to avoid conflicts)
DROP INDEX IF EXISTS idx_assistants_organization;
DROP INDEX IF EXISTS idx_assistants_type;
CREATE INDEX idx_assistants_organization ON assistants(organization_id);
CREATE INDEX idx_assistants_type ON assistants(organization_id, type);

-- Add RLS policies
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;

-- Allow organizations to view their own assistants
DROP POLICY IF EXISTS "Organizations can view their own assistants" ON assistants;
CREATE POLICY "Organizations can view their own assistants"
  ON assistants FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- Allow organizations to create their own assistants
DROP POLICY IF EXISTS "Organizations can create their own assistants" ON assistants;
CREATE POLICY "Organizations can create their own assistants"
  ON assistants FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- Allow organizations to update their own assistants
DROP POLICY IF EXISTS "Organizations can update their own assistants" ON assistants;
CREATE POLICY "Organizations can update their own assistants"
  ON assistants FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- Allow organizations to delete their own assistants
DROP POLICY IF EXISTS "Organizations can delete their own assistants" ON assistants;
CREATE POLICY "Organizations can delete their own assistants"
  ON assistants FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

