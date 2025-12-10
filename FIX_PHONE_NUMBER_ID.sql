-- ============================================
-- QUICK FIX: Update Phone Number Provider ID
-- ============================================
-- Run this in Supabase SQL Editor to fix phone numbers with invalid provider_phone_id

-- Step 1: Check current phone numbers and their IDs
-- This shows you all phone numbers and their validation status
SELECT 
  id,
  organization_id,
  phone_number,
  provider_phone_id,
  friendly_name,
  type,
  active,
  CASE 
    WHEN provider_phone_id IS NULL THEN '❌ Missing'
    WHEN provider_phone_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN '✅ Valid UUID'
    ELSE '❌ Invalid format'
  END as validation_status
FROM phone_numbers
ORDER BY created_at DESC;

-- Step 2: Find phone numbers with invalid IDs (run this to see which ones need fixing)
SELECT 
  id,
  phone_number,
  provider_phone_id,
  'This phone number needs to be updated' as note
FROM phone_numbers
WHERE active = true
  AND (
    provider_phone_id IS NULL 
    OR provider_phone_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

-- Step 3: Update a specific phone number
-- IMPORTANT: Replace the values below with actual values!
-- 
-- To get the phone number record ID:
--   1. Run Step 1 above
--   2. Copy the "id" column value (UUID) for the phone number you want to fix
--
-- To get the Vapi Phone Number UUID:
--   1. Go to https://dashboard.vapi.ai
--   2. Click "Phone Numbers" (left sidebar)
--   3. Click on your phone number
--   4. Copy the "ID" field (it's a UUID)
--
-- Then run this UPDATE query with the actual values:

-- EXAMPLE (DO NOT RUN THIS - IT'S JUST AN EXAMPLE):
-- UPDATE phone_numbers
-- SET provider_phone_id = '123e4567-e89b-12d3-a456-426614174000'  -- Vapi UUID from dashboard
-- WHERE id = 'abc12345-6789-0123-4567-890123456789';  -- Phone number record ID from Step 1

-- Step 4: Verify the update worked
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

