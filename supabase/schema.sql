-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table FIRST (no dependencies)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  industry TEXT DEFAULT 'pressure_washing',
  description TEXT,
  -- Contact Info
  email TEXT,
  phone TEXT,
  website TEXT,
  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',
  -- Business Details
  business_hours JSONB DEFAULT '{
    "monday": {"open": "08:00", "close": "18:00", "closed": false},
    "tuesday": {"open": "08:00", "close": "18:00", "closed": false},
    "wednesday": {"open": "08:00", "close": "18:00", "closed": false},
    "thursday": {"open": "08:00", "close": "18:00", "closed": false},
    "friday": {"open": "08:00", "close": "18:00", "closed": false},
    "saturday": {"open": "09:00", "close": "14:00", "closed": false},
    "sunday": {"open": "09:00", "close": "14:00", "closed": true}
  }'::jsonb,
  service_areas TEXT[], -- Array of cities/areas served
  services_offered TEXT[], -- Array of services like "House Washing", "Driveway Cleaning"
  timezone TEXT DEFAULT 'America/New_York',
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  -- Billing
  billing_customer_id TEXT,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'pro')),
  -- SMS Notification Settings
  notification_phone TEXT,
  notification_settings JSONB DEFAULT '{
    "smsEnabled": false,
    "notifyOnInbound": true,
    "notifyOnInterestedOutbound": true,
    "notifyOnCallback": true,
    "notifyOnBooked": true,
    "quietHoursEnabled": false,
    "quietHoursStart": "21:00",
    "quietHoursEnd": "08:00"
  }'::jsonb,
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_data JSONB,
  -- Setup Status
  setup_status TEXT DEFAULT 'pending' CHECK (setup_status IN (
    'pending',           -- Just submitted form, waiting for review
    'in_review',         -- Admin is reviewing application
    'setting_up',        -- Admin is creating AI agent
    'testing',           -- Agent created, being tested
    'ready',             -- Ready for customer to use
    'active'             -- Customer has subscribed and is live
  )),
  setup_notes TEXT,      -- Admin notes about setup progress
  setup_updated_at TIMESTAMPTZ,
  -- Monthly Billing Usage (only counts answered/connected calls)
  billable_calls_this_month INTEGER DEFAULT 0,
  billing_period_month INTEGER DEFAULT EXTRACT(MONTH FROM NOW()),
  billing_period_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  -- Free Trial (15 days)
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  trial_used BOOLEAN DEFAULT false -- Has the user ever used a trial?
);

-- Create profiles table (depends on organizations and auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'member', 'admin')),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL
);

-- Create organization_members table
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  UNIQUE(organization_id, profile_id)
);

-- Create vapi_configs table
CREATE TABLE vapi_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vapi_api_key TEXT,
  inbound_agent_id TEXT,
  outbound_agent_id TEXT,
  inbound_phone_number TEXT,
  outbound_phone_number TEXT,
  webhook_secret TEXT,
  active BOOLEAN DEFAULT true,
  UNIQUE(organization_id)
);

-- Create leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  property_type TEXT CHECK (property_type IN ('residential', 'commercial', 'unknown')),
  service_type TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'interested', 'not_interested', 'call_back', 'booked', 'customer')),
  notes TEXT
);

-- Create calls table
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  provider_call_id TEXT,
  from_number TEXT,
  to_number TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'ringing', 'answered', 'completed', 'failed', 'voicemail')),
  duration_seconds INTEGER,
  recording_url TEXT,
  transcript TEXT,
  summary TEXT,
  raw_payload JSONB
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  notes TEXT
);

-- Create phone_numbers table for managing multiple outbound numbers
CREATE TABLE phone_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  provider_phone_id TEXT, -- Vapi/Twilio phone number ID
  friendly_name TEXT, -- e.g., "Main Line", "Backup #1"
  type TEXT DEFAULT 'outbound' CHECK (type IN ('inbound', 'outbound', 'both')),
  daily_limit INTEGER DEFAULT 100,
  calls_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  active BOOLEAN DEFAULT true
);

-- Create call_limits table for tracking calls per lead per day
CREATE TABLE call_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
  calls_today INTEGER DEFAULT 0,
  last_call_at TIMESTAMPTZ,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(organization_id, lead_id, last_reset_date)
);

-- Create agent_configs table (replaces vapi_configs for white-labeling)
CREATE TABLE agent_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Inbound Agent Settings
  inbound_agent_id TEXT, -- Internal reference to Vapi assistant
  inbound_phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
  inbound_enabled BOOLEAN DEFAULT false,
  inbound_greeting TEXT,
  -- Outbound Agent Settings  
  outbound_agent_id TEXT, -- Internal reference to Vapi assistant
  outbound_enabled BOOLEAN DEFAULT false,
  outbound_script_type TEXT DEFAULT 'general',
  -- Schedule Settings (stored as JSONB for flexibility)
  schedule JSONB DEFAULT '{
    "enabledDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "startTime": "09:00",
    "endTime": "17:00",
    "timezone": "America/New_York"
  }'::jsonb,
  -- Daily limits
  daily_call_limit INTEGER DEFAULT 50,
  calls_made_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(organization_id)
);

-- Create campaigns table for outbound calling campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  script_type TEXT DEFAULT 'general',
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  -- Schedule settings (can override org defaults)
  schedule JSONB DEFAULT '{
    "enabledDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "startTime": "09:00",
    "endTime": "17:00",
    "timezone": "America/New_York"
  }'::jsonb,
  daily_limit INTEGER DEFAULT 50,
  -- Stats (denormalized for performance)
  total_contacts INTEGER DEFAULT 0,
  contacts_called INTEGER DEFAULT 0,
  contacts_answered INTEGER DEFAULT 0,
  contacts_interested INTEGER DEFAULT 0
);

-- Create campaign_contacts table for contacts in each campaign
CREATE TABLE campaign_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Contact info
  name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  business_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  notes TEXT,
  -- Call tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'queued',
    'calling',
    'no_answer',
    'voicemail',
    'answered',
    'interested',
    'not_interested',
    'callback',
    'wrong_number',
    'do_not_call'
  )),
  call_count INTEGER DEFAULT 0,
  last_call_at TIMESTAMPTZ,
  last_call_duration INTEGER,
  last_call_summary TEXT,
  last_call_transcript TEXT,
  -- If interested, can convert to inbound lead
  converted_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL
);

-- Add source field to leads table to distinguish inbound vs manual
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'inbound' CHECK (source IN ('inbound', 'manual', 'campaign'));

-- Create call_disputes table for customers to request review of charged calls
CREATE TABLE call_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Reference to the call being disputed (can be from calls or campaign_contacts)
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  campaign_contact_id UUID REFERENCES campaign_contacts(id) ON DELETE SET NULL,
  -- Call details (denormalized for easy review)
  call_date TIMESTAMPTZ NOT NULL,
  call_duration INTEGER,
  call_outcome TEXT NOT NULL, -- e.g., 'answered', 'voicemail', 'no_answer'
  phone_number TEXT,
  -- Dispute info
  reason TEXT NOT NULL, -- Customer's reason for dispute
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  -- Admin response
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT, -- Admin email who reviewed
  -- If approved, track credit adjustment
  credit_refunded BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vapi_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update organizations they own or admin"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for organization_members
CREATE POLICY "Users can view members of their organizations"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for vapi_configs
CREATE POLICY "Users can view vapi_configs for their organizations"
  ON vapi_configs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vapi_configs for their organizations"
  ON vapi_configs FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can insert vapi_configs for their organizations"
  ON vapi_configs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for leads
CREATE POLICY "Users can view leads for their organizations"
  ON leads FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert leads for their organizations"
  ON leads FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update leads for their organizations"
  ON leads FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for calls
CREATE POLICY "Users can view calls for their organizations"
  ON calls FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert calls for their organizations"
  ON calls FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for appointments
CREATE POLICY "Users can view appointments for their organizations"
  ON appointments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert appointments for their organizations"
  ON appointments FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update appointments for their organizations"
  ON appointments FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for phone_numbers
CREATE POLICY "Users can view phone_numbers for their organizations"
  ON phone_numbers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update phone_numbers for their organizations"
  ON phone_numbers FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for call_limits
CREATE POLICY "Users can view call_limits for their organizations"
  ON call_limits FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert call_limits for their organizations"
  ON call_limits FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update call_limits for their organizations"
  ON call_limits FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for agent_configs
CREATE POLICY "Users can view agent_configs for their organizations"
  ON agent_configs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update agent_configs for their organizations"
  ON agent_configs FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can insert agent_configs for their organizations"
  ON agent_configs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for campaigns
CREATE POLICY "Users can view campaigns for their organizations"
  ON campaigns FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert campaigns for their organizations"
  ON campaigns FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update campaigns for their organizations"
  ON campaigns FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete campaigns for their organizations"
  ON campaigns FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for campaign_contacts
CREATE POLICY "Users can view campaign_contacts for their organizations"
  ON campaign_contacts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert campaign_contacts for their organizations"
  ON campaign_contacts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update campaign_contacts for their organizations"
  ON campaign_contacts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete campaign_contacts for their organizations"
  ON campaign_contacts FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for call_disputes
CREATE POLICY "Users can view call_disputes for their organizations"
  ON call_disputes FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert call_disputes for their organizations"
  ON call_disputes FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update call_disputes for their organizations"
  ON call_disputes FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- Function to automatically create profile and organization on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  org_slug TEXT;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));

  -- Generate organization slug from email
  org_slug := lower(regexp_replace(NEW.email, '[^a-z0-9]', '', 'g')) || '-' || substr(NEW.id::text, 1, 8);

  -- Create default organization
  INSERT INTO public.organizations (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Pressure Washing Company'),
    org_slug
  )
  RETURNING id INTO new_org_id;

  -- Link profile to organization
  UPDATE public.profiles
  SET organization_id = new_org_id
  WHERE id = NEW.id;

  -- Add user as owner
  INSERT INTO public.organization_members (organization_id, profile_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TAGS SYSTEM
-- ============================================

-- Create tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6', -- Hex color for display
  UNIQUE(organization_id, name)
);

-- Create lead_tags junction table
CREATE TABLE lead_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(lead_id, tag_id)
);

-- ============================================
-- ACTIVITY LOG SYSTEM
-- ============================================

-- Create activity_logs table for tracking all lead activities
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  campaign_contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  -- Activity info
  type TEXT NOT NULL CHECK (type IN (
    'call_inbound', 'call_outbound', 'call_missed', 'call_voicemail',
    'lead_created', 'lead_updated', 'lead_status_changed',
    'appointment_created', 'appointment_updated', 'appointment_cancelled',
    'tag_added', 'tag_removed',
    'note_added', 'email_sent', 'sms_sent',
    'score_updated', 'converted_from_campaign'
  )),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB, -- Additional data specific to the activity type
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Who performed the action (null = system)
  actor_name TEXT -- Denormalized for easy display
);

-- ============================================
-- NOTIFICATIONS SYSTEM
-- ============================================

-- Create notifications table for in-app notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- If null, visible to all org members
  -- Notification content
  type TEXT NOT NULL CHECK (type IN (
    'new_lead', 'call_completed', 'appointment_booked', 'callback_reminder',
    'dispute_resolved', 'setup_status', 'usage_warning', 'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- URL to navigate to
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  -- Related entities
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL
);

-- ============================================
-- AUTOMATED FOLLOW-UP RULES
-- ============================================

-- Create follow_up_rules table
CREATE TABLE follow_up_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Rule config
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  -- Trigger conditions
  trigger_status TEXT NOT NULL CHECK (trigger_status IN (
    'no_answer', 'voicemail', 'callback', 'interested'
  )),
  -- Action config
  action TEXT NOT NULL CHECK (action IN ('schedule_call', 'send_sms', 'create_task')),
  delay_hours INTEGER DEFAULT 24, -- How long to wait before action
  max_attempts INTEGER DEFAULT 3, -- Maximum times to attempt follow-up
  -- Schedule constraints
  only_during_business_hours BOOLEAN DEFAULT true,
  -- Optional message for SMS
  message_template TEXT
);

-- Create scheduled_follow_ups table
CREATE TABLE scheduled_follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES follow_up_rules(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  campaign_contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  -- Schedule info
  scheduled_for TIMESTAMPTZ NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('schedule_call', 'send_sms', 'create_task')),
  attempt_number INTEGER DEFAULT 1,
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
  executed_at TIMESTAMPTZ,
  result TEXT
);

-- ============================================
-- LEAD SCORING
-- ============================================

-- Add score column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_factors JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_scored_at TIMESTAMPTZ;

-- ============================================
-- NOTES SYSTEM
-- ============================================

-- Create notes table for manual notes on leads
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  campaign_contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  -- Note content
  content TEXT NOT NULL,
  -- Author
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name TEXT,
  -- Pinned notes appear at top
  pinned BOOLEAN DEFAULT false
);

-- ============================================
-- ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

-- Tags policies
CREATE POLICY "Users can view tags for their organizations"
  ON tags FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can manage tags for their organizations"
  ON tags FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));

-- Lead tags policies
CREATE POLICY "Users can view lead_tags for their organizations"
  ON lead_tags FOR SELECT
  USING (lead_id IN (SELECT id FROM leads WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid())));

CREATE POLICY "Users can manage lead_tags for their organizations"
  ON lead_tags FOR ALL
  USING (lead_id IN (SELECT id FROM leads WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid())));

-- Activity logs policies
CREATE POLICY "Users can view activity_logs for their organizations"
  ON activity_logs FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can insert activity_logs for their organizations"
  ON activity_logs FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));

-- Notifications policies
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid())
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid())
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Follow-up rules policies
CREATE POLICY "Users can view follow_up_rules for their organizations"
  ON follow_up_rules FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can manage follow_up_rules for their organizations"
  ON follow_up_rules FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')));

-- Scheduled follow-ups policies
CREATE POLICY "Users can view scheduled_follow_ups for their organizations"
  ON scheduled_follow_ups FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can manage scheduled_follow_ups for their organizations"
  ON scheduled_follow_ups FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));

-- Notes policies
CREATE POLICY "Users can view notes for their organizations"
  ON notes FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can manage notes for their organizations"
  ON notes FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));

-- ============================================
-- REFERRAL PROGRAM
-- ============================================

-- Add referral_code and email_reports_enabled to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email_reports_enabled BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS referred_by TEXT; -- Code of referrer

-- Create referrals table to track all referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- The organization that made the referral
  referrer_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- The organization that was referred (NULL until they sign up)
  referred_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  -- Contact info captured at referral time
  referred_email TEXT,
  referred_name TEXT,
  -- Tracking
  referral_code TEXT NOT NULL, -- Code used
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'completed', 'expired')),
  -- Rewards
  reward_amount INTEGER DEFAULT 50,
  referrer_credited BOOLEAN DEFAULT false,
  referred_credited BOOLEAN DEFAULT false,
  -- Completion
  signed_up_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ -- When they subscribed to paid plan
);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view referrals they made"
  ON referrals FOR SELECT
  USING (referrer_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "System can insert referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update referrals"
  ON referrals FOR UPDATE
  USING (true);

-- ============================================
-- INTEGRATIONS
-- ============================================

-- Create integrations table to track connected integrations
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Integration details
  provider TEXT NOT NULL, -- 'zapier', 'google_calendar', 'hubspot', etc.
  name TEXT,
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error')),
  -- Credentials (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  -- Settings
  settings JSONB DEFAULT '{}',
  -- Webhooks
  webhook_url TEXT,
  webhook_secret TEXT,
  -- Last sync
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  UNIQUE(organization_id, provider)
);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for integrations
CREATE POLICY "Users can view integrations for their organizations"
  ON integrations FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can manage integrations for their organizations"
  ON integrations FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')));

-- ============================================
-- INTEGRATION REQUESTS
-- ============================================

-- Create integration_requests table for user feedback
CREATE TABLE integration_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Request details
  integration_name TEXT NOT NULL,
  category TEXT NOT NULL,
  website TEXT,
  use_case TEXT,
  priority TEXT DEFAULT 'nice_to_have' CHECK (priority IN ('nice_to_have', 'important', 'critical')),
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'planned', 'in_progress', 'completed', 'declined')),
  admin_notes TEXT,
  -- Voting (for future feature)
  vote_count INTEGER DEFAULT 1
);

-- Enable RLS
ALTER TABLE integration_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for integration_requests
CREATE POLICY "Users can view their integration requests"
  ON integration_requests FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can insert integration requests"
  ON integration_requests FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));

-- Index for faster lookups
CREATE INDEX idx_integration_requests_org ON integration_requests(organization_id);
CREATE INDEX idx_integration_requests_name ON integration_requests(integration_name);

