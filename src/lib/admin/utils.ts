/**
 * Utility functions for admin operations
 * These can be used in both client and server components
 */

/**
 * Get effective plan for an organization (considers admin-granted plans)
 */
export function getEffectivePlan(org: {
  plan: string | null
  admin_granted_plan: string | null
  admin_granted_plan_expires_at: string | null
}): 'starter' | 'growth' | 'pro' | null {
  // Check if admin-granted plan is active
  if (org.admin_granted_plan) {
    const expiresAt = org.admin_granted_plan_expires_at
      ? new Date(org.admin_granted_plan_expires_at)
      : null

    // If no expiration or not expired, use admin-granted plan
    if (!expiresAt || expiresAt > new Date()) {
      return org.admin_granted_plan as 'starter' | 'growth' | 'pro'
    }
  }

  // Otherwise use regular plan
  return org.plan as 'starter' | 'growth' | 'pro' | null
}

/**
 * Check if organization has a specific privilege
 */
export function hasPrivilege(
  org: {
    admin_privileges: any
  },
  privilege: string
): boolean {
  const privileges = org.admin_privileges || {}
  return privileges[privilege] === true
}

/**
 * Check if organization is blocked from accessing starter plan
 */
export function isStarterPlanBlocked(org: {
  admin_privileges: any
}): boolean {
  return hasPrivilege(org, 'starter_plan_blocked')
}

