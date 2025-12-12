-- Add billable_minutes_this_month to organizations table
-- This tracks actual minutes used instead of estimating from call counts

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS billable_minutes_this_month INTEGER DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN organizations.billable_minutes_this_month IS 'Actual outbound minutes used this billing period (resets monthly)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_organizations_billable_minutes ON organizations(billable_minutes_this_month) WHERE billable_minutes_this_month > 0;

