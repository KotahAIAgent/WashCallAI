-- Add AI conversation intelligence fields to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS sentiment TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2); -- -1.0 to 1.0
ALTER TABLE calls ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]'::jsonb; -- Array of extracted topics
ALTER TABLE calls ADD COLUMN IF NOT EXISTS ai_notes TEXT; -- Auto-generated structured notes
ALTER TABLE calls ADD COLUMN IF NOT EXISTS talk_time_seconds INTEGER; -- Agent talk time
ALTER TABLE calls ADD COLUMN IF NOT EXISTS listen_time_seconds INTEGER; -- Agent listen time
ALTER TABLE calls ADD COLUMN IF NOT EXISTS talk_listen_ratio DECIMAL(4,2); -- Calculated ratio

-- Add same fields to campaign_contacts for outbound calls
ALTER TABLE campaign_contacts ADD COLUMN IF NOT EXISTS last_call_sentiment TEXT;
ALTER TABLE campaign_contacts ADD COLUMN IF NOT EXISTS last_call_sentiment_score DECIMAL(3,2);
ALTER TABLE campaign_contacts ADD COLUMN IF NOT EXISTS last_call_topics JSONB;
ALTER TABLE campaign_contacts ADD COLUMN IF NOT EXISTS last_call_ai_notes TEXT;
ALTER TABLE campaign_contacts ADD COLUMN IF NOT EXISTS last_call_talk_time INTEGER;
ALTER TABLE campaign_contacts ADD COLUMN IF NOT EXISTS last_call_listen_time INTEGER;
ALTER TABLE campaign_contacts ADD COLUMN IF NOT EXISTS last_call_talk_listen_ratio DECIMAL(4,2);

-- Create trending topics table
CREATE TABLE IF NOT EXISTS trending_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  mention_count INTEGER DEFAULT 1,
  first_mentioned_at TIMESTAMPTZ DEFAULT NOW(),
  last_mentioned_at TIMESTAMPTZ DEFAULT NOW(),
  time_period TEXT DEFAULT 'daily' CHECK (time_period IN ('daily', 'weekly', 'monthly')),
  UNIQUE(organization_id, topic, time_period)
);

-- Create index for trending topics queries
CREATE INDEX IF NOT EXISTS idx_trending_topics_org_period ON trending_topics(organization_id, time_period, mention_count DESC);

-- Add transcript search vector support (using pg_trgm for text search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create index for transcript search
CREATE INDEX IF NOT EXISTS idx_calls_transcript_search ON calls USING gin(transcript gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_transcript_search ON campaign_contacts USING gin(last_call_transcript gin_trgm_ops);

-- Add call intelligence metadata JSONB field for extensibility
ALTER TABLE calls ADD COLUMN IF NOT EXISTS intelligence_metadata JSONB DEFAULT '{}'::jsonb;

-- Create live calls table for real-time monitoring
CREATE TABLE IF NOT EXISTS live_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  provider_call_id TEXT NOT NULL UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT,
  to_number TEXT,
  status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'answered', 'in_progress', 'completed', 'ended')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  recording_url TEXT,
  stream_url TEXT -- For live monitoring
);

-- Create index for live calls lookup
CREATE INDEX IF NOT EXISTS idx_live_calls_org_status ON live_calls(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_live_calls_provider_id ON live_calls(provider_call_id);

-- Enable RLS on new tables
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_calls ENABLE ROW LEVEL SECURITY;

-- RLS policies for trending_topics
DROP POLICY IF EXISTS "Organizations can view their trending topics" ON trending_topics;
CREATE POLICY "Organizations can view their trending topics"
  ON trending_topics FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- RLS policies for live_calls
DROP POLICY IF EXISTS "Organizations can view their live calls" ON live_calls;
CREATE POLICY "Organizations can view their live calls"
  ON live_calls FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

