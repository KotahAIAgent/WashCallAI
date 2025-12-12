-- Update daily_limit to 20 for outbound phone numbers
-- This applies to phone numbers with type 'outbound' or 'both'

-- Step 1: Update existing outbound phone numbers to have a limit of 20
UPDATE phone_numbers
SET daily_limit = 20
WHERE type IN ('outbound', 'both') AND daily_limit > 20;

-- Step 2: Change the default for new phone numbers
-- Note: We can't change the DEFAULT value directly, but we'll ensure new outbound numbers get 20
-- The application code should set this when creating phone numbers

-- Step 3: Add a check constraint to ensure outbound numbers don't exceed 20
-- (Optional - can be added if you want to enforce this at the database level)
-- ALTER TABLE phone_numbers 
-- ADD CONSTRAINT check_outbound_daily_limit 
-- CHECK (
--   (type = 'inbound' AND daily_limit <= 100) OR
--   (type IN ('outbound', 'both') AND daily_limit <= 20) OR
--   (type = 'inbound')
-- );

