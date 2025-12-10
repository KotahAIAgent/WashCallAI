-- ============================================
-- SCALABILITY INDEXES FOR 50+ CLIENTS
-- ============================================
-- These indexes optimize queries that will be frequent with many organizations

-- Calls table indexes (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_calls_organization_id ON calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_organization_created ON calls(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_direction ON calls(direction);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON calls(lead_id) WHERE lead_id IS NOT NULL;

-- Leads table indexes
CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_organization_status ON leads(organization_id, status);

-- Phone numbers table indexes (critical for webhook lookups)
CREATE INDEX IF NOT EXISTS idx_phone_numbers_organization_id ON phone_numbers(organization_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_provider_id ON phone_numbers(provider_phone_id) WHERE provider_phone_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_phone_numbers_phone_number ON phone_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_active ON phone_numbers(active, type) WHERE active = true;

-- Agent configs indexes (critical for webhook routing)
CREATE INDEX IF NOT EXISTS idx_agent_configs_inbound_agent_id ON agent_configs(inbound_agent_id) WHERE inbound_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_configs_outbound_agent_id ON agent_configs(outbound_agent_id) WHERE outbound_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_configs_organization_enabled ON agent_configs(organization_id, outbound_enabled) WHERE outbound_enabled = true;

-- Call limits indexes
CREATE INDEX IF NOT EXISTS idx_call_limits_organization_lead ON call_limits(organization_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_call_limits_reset_date ON call_limits(last_reset_date);

-- Campaign contacts indexes
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign_status ON campaign_contacts(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_phone ON campaign_contacts(phone) WHERE phone IS NOT NULL;

-- Profiles and organization members (for RLS performance)
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_org_members_profile_id ON organization_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_setup_status ON organizations(setup_status);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan) WHERE plan IS NOT NULL;

