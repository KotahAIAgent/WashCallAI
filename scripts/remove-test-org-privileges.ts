/**
 * Script to remove all privileges from NANO SEAL test organization
 * Run with: npx tsx scripts/remove-test-org-privileges.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function removePrivileges() {
  console.log('Removing privileges from NANO SEAL organization...')
  
  // Find the organization
  const { data: orgs, error: findError } = await supabase
    .from('organizations')
    .select('id, name, slug, plan, admin_granted_plan, admin_privileges, trial_ends_at')
    .or('slug.eq.dakkotahester10gmailcom-0635f3c9,name.ilike.%NANO SEAL%')
  
  if (findError) {
    console.error('Error finding organization:', findError)
    process.exit(1)
  }
  
  if (!orgs || orgs.length === 0) {
    console.error('Organization not found')
    process.exit(1)
  }
  
  const org = orgs[0]
  console.log(`Found organization: ${org.name} (${org.id})`)
  console.log('Current privileges:', {
    plan: org.plan,
    admin_granted_plan: org.admin_granted_plan,
    admin_privileges: org.admin_privileges,
    trial_ends_at: org.trial_ends_at,
  })
  
  // Remove all privileges
  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      admin_granted_plan: null,
      admin_granted_plan_expires_at: null,
      admin_granted_plan_notes: null,
      admin_privileges: {},
      admin_privileges_notes: null,
      plan: null, // Remove regular plan too
      trial_ends_at: null, // Remove trial
    })
    .eq('id', org.id)
  
  if (updateError) {
    console.error('Error removing privileges:', updateError)
    process.exit(1)
  }
  
  console.log('✅ Successfully removed all privileges from NANO SEAL organization')
  console.log('The organization now has no plan, no trial, and no admin privileges')
  console.log('Inbound calls should now be blocked by the pre-call check')
}

removePrivileges().catch(console.error)

