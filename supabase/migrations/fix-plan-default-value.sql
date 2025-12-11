-- Fix plan default value: plan should be NULL by default, not 'starter'
-- The plan should only be set when an organization actually subscribes through Stripe

-- Step 1: Remove the default value constraint
ALTER TABLE organizations 
  ALTER COLUMN plan DROP DEFAULT;

-- Step 2: Update any organizations that have plan='starter' but no actual subscription
-- These are organizations that were created with the incorrect default but never actually subscribed
-- We'll set their plan to NULL if they don't have a billing_customer_id
UPDATE organizations 
SET plan = NULL 
WHERE plan = 'starter' 
  AND billing_customer_id IS NULL;

-- Step 3: Add a comment explaining the plan field
COMMENT ON COLUMN organizations.plan IS 'Paid subscription plan. NULL means no active subscription. Set only when organization subscribes through Stripe.';

