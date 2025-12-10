-- ============================================
-- UPDATE PHONE NUMBER WITH VAPI ID
-- ============================================
-- Your Vapi Phone Number ID: 3d642648-36b2-4119-b204-e717eba81316

-- Step 1: Find your phone number record
-- This will show you all phone numbers so you can find the one to update
SELECT 
  id,
  phone_number,
  provider_phone_id,
  friendly_name,
  organization_id,
  type,
  active,
  CASE 
    WHEN provider_phone_id IS NULL THEN '❌ Missing'
    WHEN provider_phone_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN '✅ Valid UUID'
    ELSE '❌ Invalid format'
  END as validation_status
FROM phone_numbers
WHERE active = true
ORDER BY created_at DESC;

-- Step 2: Update the phone number
-- Replace 'YOUR_PHONE_NUMBER_RECORD_ID' with the actual "id" from Step 1
-- The Vapi ID is already filled in: 3d642648-36b2-4119-b204-e717eba81316
UPDATE phone_numbers
SET provider_phone_id = '3d642648-36b2-4119-b204-e717eba81316'
WHERE id = 'YOUR_PHONE_NUMBER_RECORD_ID';  -- ⚠️ REPLACE THIS with the actual id from Step 1

-- Step 3: Verify the update worked
SELECT 
  id,
  phone_number,
  provider_phone_id,
  CASE 
    WHEN provider_phone_id = '3d642648-36b2-4119-b204-e717eba81316' THEN '✅ Updated correctly'
    WHEN provider_phone_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN '✅ Valid UUID'
    ELSE '❌ Invalid format'
  END as validation_status
FROM phone_numbers
WHERE active = true;

