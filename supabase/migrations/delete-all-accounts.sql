-- WARNING: This will delete ALL user accounts and their associated data
-- This is IRREVERSIBLE. Make sure you have backups if needed.
-- Run this in Supabase SQL Editor

-- First, let's see what we're about to delete (optional - for verification)
SELECT 
  COUNT(*) as total_users,
  COUNT(DISTINCT p.organization_id) as total_organizations
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id;

-- Delete all user accounts from auth.users
-- This will CASCADE delete:
--   - All profiles (ON DELETE CASCADE)
--   - All organization_members (ON DELETE CASCADE via profiles)
--   - All data in tables with ON DELETE CASCADE references
DELETE FROM auth.users;

-- Delete any orphaned organizations (organizations without any members)
-- This is safe because if there are no members, there's no data to lose
DELETE FROM organizations
WHERE id NOT IN (
  SELECT DISTINCT organization_id 
  FROM organization_members 
  WHERE organization_id IS NOT NULL
);

-- Verify deletion
SELECT 
  COUNT(*) as remaining_users
FROM auth.users;

SELECT 
  COUNT(*) as remaining_organizations
FROM organizations;

