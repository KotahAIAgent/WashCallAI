-- Migration: Add credit system for 6-month setup fee credit
-- Description: Adds columns to track account credits and setup fee credit eligibility

-- Add credit tracking to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS account_credit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS setup_fee_credited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_fee_credited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_orgs_subscription_start ON organizations(subscription_started_at);

-- Add comments
COMMENT ON COLUMN organizations.account_credit IS 'Account credit in cents (e.g., 9900 = $99.00)';
COMMENT ON COLUMN organizations.setup_fee_credited IS 'Whether setup fee has been credited after 6 months';
COMMENT ON COLUMN organizations.setup_fee_credited_at IS 'Timestamp when setup fee was credited';
COMMENT ON COLUMN organizations.subscription_started_at IS 'When the paid subscription started (for 6-month credit calculation)';

