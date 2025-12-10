-- ============================================
-- QUICK FIX: Update Phone Number Provider ID
-- ============================================
-- Run this in Supabase SQL Editor to fix phone numbers with invalid provider_phone_id

-- Step 1: Check current phone numbers and their IDs
SELECT 
  id,
  organization_id,
  phone_number,
  provider_phone_id,
  friendly_name,
  type,
  active
FROM phone_numbers
ORDER BY created_at DESC;

-- Step 2: Update a specific phone number with the correct Vapi UUID
-- Replace 'YOUR_PHONE_NUMBER_ID' with the actual phone number record ID (UUID from phone_numbers table)
-- Replace 'VAPI_PHONE_NUMBER_UUID' with the UUID from Vapi dashboard
UPDATE phone_numbers
SET provider_phone_id = 'VAPI_PHONE_NUMBER_UUID'  -- Replace with actual UUID from Vapi
WHERE id = 'YOUR_PHONE_NUMBER_ID';  -- Replace with phone number record ID

-- Example:
-- UPDATE phone_numbers
-- SET provider_phone_id = '123e4567-e89b-12d3-a456-426614174000'
-- WHERE id = 'abc12345-6789-0123-4567-890123456789';

-- Step 3: Verify the update
SELECT 
  id,
  phone_number,
  provider_phone_id,
  CASE 
    WHEN provider_phone_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN '✅ Valid UUID'
    ELSE '❌ Invalid format'
  END as validation_status
FROM phone_numbers
WHERE active = true;

