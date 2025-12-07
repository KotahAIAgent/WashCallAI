-- Helper script to set subscription_started_at for existing organizations
-- Run this in Supabase SQL Editor if you have existing subscriptions

-- Option 1: Set to organization creation date (if subscription started immediately)
-- UPDATE organizations
-- SET subscription_started_at = created_at
-- WHERE plan IS NOT NULL 
--   AND subscription_started_at IS NULL;

-- Option 2: Set to a specific date (adjust as needed)
-- UPDATE organizations
-- SET subscription_started_at = '2024-01-01T00:00:00Z'::timestamptz
-- WHERE id = 'your-org-id-here'
--   AND subscription_started_at IS NULL;

-- Option 3: Set based on Stripe subscription created date (if you have that data)
-- You would need to query Stripe API and update accordingly

-- Verify the updates
-- SELECT id, name, plan, subscription_started_at, created_at
-- FROM organizations
-- WHERE plan IS NOT NULL
-- ORDER BY created_at DESC;

