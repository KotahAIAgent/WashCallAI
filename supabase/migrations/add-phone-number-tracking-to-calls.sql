-- Add phone_number_id to calls table to track which phone number was used
ALTER TABLE calls 
ADD COLUMN IF NOT EXISTS phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL;

-- Also add a direct phone_number field for easier querying
ALTER TABLE calls 
ADD COLUMN IF NOT EXISTS organization_phone_number TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calls_phone_number_id ON calls(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_calls_org_phone_number ON calls(organization_phone_number);

