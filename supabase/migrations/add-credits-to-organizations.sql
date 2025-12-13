-- Add purchased credits field to organizations table
-- Credits are purchased minutes that persist across billing periods
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS purchased_credits_minutes INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN organizations.purchased_credits_minutes IS 'Purchased credits in minutes. These persist across billing periods and are used after monthly plan minutes are exhausted.';

