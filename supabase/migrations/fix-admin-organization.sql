-- Fix admin user organization issue
-- This ensures the admin user has a profile and organization

-- First, check if the user exists
SELECT id, email FROM auth.users WHERE email = 'dakkota@dshpressure.com';

-- If the user exists but doesn't have a profile, create one
INSERT INTO profiles (id, full_name, role)
SELECT 
  id,
  'Dakkota Hester',
  'owner'
FROM auth.users
WHERE email = 'dakkota@dshpressure.com'
  AND id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Create an organization for the admin if they don't have one
DO $$
DECLARE
  user_id UUID;
  org_id UUID;
  org_slug TEXT;
BEGIN
  -- Get the user ID
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'dakkota@dshpressure.com';

  IF user_id IS NOT NULL THEN
    -- Check if user already has an organization
    SELECT organization_id INTO org_id
    FROM profiles
    WHERE id = user_id;

    -- If no organization, create one
    IF org_id IS NULL THEN
      org_slug := 'dsh-pressure-washing-' || substr(user_id::text, 1, 8);
      
      INSERT INTO organizations (name, slug, plan, setup_status)
      VALUES ('DSH Pressure Washing', org_slug, 'pro', 'active')
      RETURNING id INTO org_id;

      -- Link profile to organization
      UPDATE profiles
      SET organization_id = org_id
      WHERE id = user_id;

      -- Add user as owner
      INSERT INTO organization_members (organization_id, profile_id, role)
      VALUES (org_id, user_id, 'owner')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;

-- Verify the fix
SELECT 
  u.email,
  p.full_name,
  p.organization_id,
  o.name as organization_name,
  o.plan
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN organizations o ON o.id = p.organization_id
WHERE u.email = 'dakkota@dshpressure.com';

