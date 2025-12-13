-- Add voice settings to agent_configs
ALTER TABLE agent_configs
ADD COLUMN IF NOT EXISTS voice_provider TEXT DEFAULT 'elevenlabs',
ADD COLUMN IF NOT EXISTS voice_id TEXT,
ADD COLUMN IF NOT EXISTS voice_name TEXT;

-- Create prompt_change_requests table
CREATE TABLE IF NOT EXISTS prompt_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('inbound', 'outbound', 'both')),
  current_prompt TEXT,
  requested_changes TEXT NOT NULL,
  reason TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'implemented', 'declined')),
  admin_notes TEXT,
  implemented_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE prompt_change_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'prompt_change_requests' 
    AND policyname = 'Users can view their prompt change requests'
  ) THEN
    CREATE POLICY "Users can view their prompt change requests"
      ON prompt_change_requests FOR SELECT
      USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'prompt_change_requests' 
    AND policyname = 'Users can create prompt change requests'
  ) THEN
    CREATE POLICY "Users can create prompt change requests"
      ON prompt_change_requests FOR INSERT
      WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));
  END IF;
END $$;

