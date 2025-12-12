-- Clear all Stripe customer IDs from organizations
-- This removes any connection to old Stripe accounts
-- Run this before connecting a new Stripe account

UPDATE organizations
SET billing_customer_id = NULL
WHERE billing_customer_id IS NOT NULL;

-- Verify the update
SELECT 
  COUNT(*) as total_orgs,
  COUNT(billing_customer_id) as orgs_with_stripe_id,
  COUNT(*) - COUNT(billing_customer_id) as orgs_without_stripe_id
FROM organizations;

