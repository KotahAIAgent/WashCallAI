-- Add client_sms_enabled flag to organizations table
-- This allows organizations to enable/disable AI-generated SMS follow-ups to clients
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS client_sms_enabled BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN organizations.client_sms_enabled IS 'Enables AI-generated Hormozi-style SMS follow-ups to clients after calls. Defaults to true.';

