-- Create call_disputes table for customers to request review of charged calls
-- This is an idempotent migration - safe to run multiple times

DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'call_disputes') THEN
    CREATE TABLE call_disputes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      -- Reference to the call being disputed (can be from calls or campaign_contacts)
      call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
      campaign_contact_id UUID REFERENCES campaign_contacts(id) ON DELETE SET NULL,
      -- Call details (denormalized for easy review)
      call_date TIMESTAMPTZ NOT NULL,
      call_duration INTEGER,
      call_outcome TEXT NOT NULL, -- e.g., 'answered', 'voicemail', 'no_answer'
      phone_number TEXT,
      -- Dispute info
      reason TEXT NOT NULL, -- Customer's reason for dispute
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
      -- Admin response
      admin_notes TEXT,
      reviewed_at TIMESTAMPTZ,
      reviewed_by TEXT, -- Admin email who reviewed
      -- If approved, track credit adjustment
      credit_refunded BOOLEAN DEFAULT false
    );

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_call_disputes_organization_id ON call_disputes(organization_id);
    CREATE INDEX IF NOT EXISTS idx_call_disputes_status ON call_disputes(status);
    CREATE INDEX IF NOT EXISTS idx_call_disputes_call_id ON call_disputes(call_id);
    CREATE INDEX IF NOT EXISTS idx_call_disputes_campaign_contact_id ON call_disputes(campaign_contact_id);
    CREATE INDEX IF NOT EXISTS idx_call_disputes_created_at ON call_disputes(created_at DESC);

    -- Enable Row Level Security
    ALTER TABLE call_disputes ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    -- Users can view call_disputes for their organizations
    CREATE POLICY "Users can view call_disputes for their organizations"
      ON call_disputes FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE profile_id = auth.uid()
        )
      );

    -- Users can insert call_disputes for their organizations
    CREATE POLICY "Users can insert call_disputes for their organizations"
      ON call_disputes FOR INSERT
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE profile_id = auth.uid()
        )
      );

    -- Users can update call_disputes for their organizations
    CREATE POLICY "Users can update call_disputes for their organizations"
      ON call_disputes FOR UPDATE
      USING (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE profile_id = auth.uid()
        )
      );

    RAISE NOTICE 'call_disputes table created successfully';
  ELSE
    RAISE NOTICE 'call_disputes table already exists, skipping creation';
  END IF;
END $$;

