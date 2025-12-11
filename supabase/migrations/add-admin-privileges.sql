-- Add admin privilege fields to organizations table
-- This allows admins to grant temporary plan upgrades and special privileges

-- Add columns first (without constraints)
DO $$ 
BEGIN
  -- Add admin_granted_plan column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'admin_granted_plan'
  ) THEN
    ALTER TABLE organizations ADD COLUMN admin_granted_plan TEXT;
  END IF;

  -- Add admin_granted_plan_expires_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'admin_granted_plan_expires_at'
  ) THEN
    ALTER TABLE organizations ADD COLUMN admin_granted_plan_expires_at TIMESTAMPTZ;
  END IF;

  -- Add admin_granted_plan_notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'admin_granted_plan_notes'
  ) THEN
    ALTER TABLE organizations ADD COLUMN admin_granted_plan_notes TEXT;
  END IF;

  -- Add admin_privileges column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'admin_privileges'
  ) THEN
    ALTER TABLE organizations ADD COLUMN admin_privileges JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add admin_privileges_notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'admin_privileges_notes'
  ) THEN
    ALTER TABLE organizations ADD COLUMN admin_privileges_notes TEXT;
  END IF;
END $$;

-- Add check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'organizations' 
      AND constraint_name = 'organizations_admin_granted_plan_check'
  ) THEN
    ALTER TABLE organizations 
      ADD CONSTRAINT organizations_admin_granted_plan_check 
      CHECK (admin_granted_plan IS NULL OR admin_granted_plan IN ('starter', 'growth', 'pro'));
  END IF;
END $$;

-- Add comment explaining the fields
COMMENT ON COLUMN organizations.admin_granted_plan IS 'Temporary plan upgrade granted by admin. Overrides regular plan when active.';
COMMENT ON COLUMN organizations.admin_granted_plan_expires_at IS 'When the admin-granted plan expires. NULL means it never expires.';
COMMENT ON COLUMN organizations.admin_granted_plan_notes IS 'Admin notes about why this plan was granted.';
COMMENT ON COLUMN organizations.admin_privileges IS 'JSON object with special privileges granted by admin (e.g., {"unlimited_calls": true, "bypass_limits": true}).';
COMMENT ON COLUMN organizations.admin_privileges_notes IS 'Admin notes about special privileges granted.';

-- Create index for querying admin grants (without time-based predicate since NOW() is not immutable)
-- Note: We can't use NOW() in index predicates, so we index all non-null admin_granted_plan values
-- The expiration check will be done in the query itself, not in the index
CREATE INDEX IF NOT EXISTS idx_organizations_admin_granted_plan_active 
  ON organizations(admin_granted_plan) 
  WHERE admin_granted_plan IS NOT NULL;

