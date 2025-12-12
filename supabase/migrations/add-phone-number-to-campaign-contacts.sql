-- Add phone_number_id column to campaign_contacts table
-- This allows assigning specific phone numbers to individual contacts
-- If null, the system will use the campaign's phone_number_id or auto-assign

ALTER TABLE campaign_contacts 
ADD COLUMN IF NOT EXISTS phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_phone_number_id 
ON campaign_contacts(phone_number_id);

-- Add comment
COMMENT ON COLUMN campaign_contacts.phone_number_id IS 'Assigned phone number for this contact. If null, uses campaign phone_number_id or auto-assigns.';

