-- Remove all privileges from NANO SEAL organization for testing
-- Organization slug: dakkotahester10gmailcom-0635f3c9
-- Owner: ddd

-- Remove admin-granted plan
UPDATE organizations
SET 
  admin_granted_plan = NULL,
  admin_granted_plan_expires_at = NULL,
  admin_granted_plan_notes = NULL,
  admin_privileges = '{}'::jsonb,
  admin_privileges_notes = NULL,
  plan = NULL, -- Also remove regular plan if it exists
  trial_ends_at = NULL -- Remove trial if it exists
WHERE slug = 'dakkotahester10gmailcom-0635f3c9'
  OR name ILIKE '%NANO SEAL%';

-- Verify the update
SELECT 
  id,
  name,
  slug,
  plan,
  admin_granted_plan,
  admin_granted_plan_expires_at,
  admin_privileges,
  trial_ends_at
FROM organizations
WHERE slug = 'dakkotahester10gmailcom-0635f3c9'
  OR name ILIKE '%NANO SEAL%';

