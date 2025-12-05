'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Organization = Database['public']['Tables']['organizations']['Row']

interface OrganizationContextType {
  organization: Organization | null
  loading: boolean
  refresh: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchOrganization = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      // Get user's profile to find organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', session.user.id)
        .single()

      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single()

        setOrganization(org)
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganization()
  }, [])

  return (
    <OrganizationContext.Provider value={{ organization, loading, refresh: fetchOrganization }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}

