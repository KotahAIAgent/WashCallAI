-- Add dialing mode and answering machine detection to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS dialing_mode TEXT DEFAULT 'sequential' CHECK (dialing_mode IN ('sequential', 'parallel', 'power', 'preview'));
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS parallel_dial_count INTEGER DEFAULT 1; -- For parallel dialing
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS answering_machine_detection BOOLEAN DEFAULT true;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS voicemail_drop_enabled BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS voicemail_drop_message TEXT; -- Pre-recorded message URL

-- Add branded caller ID fields to phone_numbers
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS branded_caller_id_enabled BOOLEAN DEFAULT false;
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS branded_name TEXT; -- Company name to display
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS branded_logo_url TEXT;
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS call_reason TEXT; -- Reason for calling to display

-- Add spam remediation settings to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS spam_remediation_enabled BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS caller_id_verification_enabled BOOLEAN DEFAULT true;

