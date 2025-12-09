-- Create table for Vapi to write call data directly via Supabase integration
-- Vapi will write to this table, and we'll use triggers to process it

CREATE TABLE IF NOT EXISTS vapi_call_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Vapi call data
  call_id TEXT, -- Vapi's call ID
  assistant_id TEXT, -- Vapi assistant ID
  phone_number_id TEXT, -- Vapi phone number ID
  direction TEXT, -- 'inbound' or 'outbound'
  status TEXT, -- 'queued', 'ringing', 'answered', 'completed', 'failed', etc.
  from_number TEXT,
  to_number TEXT,
  duration_seconds INTEGER,
  recording_url TEXT,
  transcript TEXT,
  summary TEXT,
  -- Metadata from Vapi
  metadata JSONB, -- Can contain organizationId, leadId, etc.
  -- Raw payload from Vapi
  raw_data JSONB,
  -- Processing status
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vapi_call_events_call_id ON vapi_call_events(call_id);
CREATE INDEX IF NOT EXISTS idx_vapi_call_events_processed ON vapi_call_events(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_vapi_call_events_assistant_id ON vapi_call_events(assistant_id);
CREATE INDEX IF NOT EXISTS idx_vapi_call_events_phone_number_id ON vapi_call_events(phone_number_id);

-- Enable RLS (but allow Vapi service role to insert)
ALTER TABLE vapi_call_events ENABLE ROW LEVEL SECURITY;

-- Allow Vapi to insert (using service role key)
-- Note: Vapi will use your Supabase service role key to write to this table
CREATE POLICY "Allow Vapi service role to insert call events"
  ON vapi_call_events FOR INSERT
  WITH CHECK (true); -- Vapi will authenticate with service role key

-- Allow authenticated users to view processed events
CREATE POLICY "Users can view processed call events"
  ON vapi_call_events FOR SELECT
  USING (processed = true);

-- Function to process Vapi call events and create calls/leads
CREATE OR REPLACE FUNCTION process_vapi_call_event()
RETURNS TRIGGER AS $$
DECLARE
  v_organization_id UUID;
  v_phone_number_id UUID;
  v_phone_record RECORD;
  v_call_id UUID;
  v_lead_id UUID;
  v_direction TEXT;
  v_lead_phone TEXT;
BEGIN
  -- Skip if already processed
  IF NEW.processed THEN
    RETURN NEW;
  END IF;

  -- Try to get organization ID from metadata first
  IF NEW.metadata IS NOT NULL AND NEW.metadata->>'organizationId' IS NOT NULL THEN
    v_organization_id := (NEW.metadata->>'organizationId')::UUID;
  ELSE
    -- Try to find organization by phone number
    -- First try by provider_phone_id
    IF NEW.phone_number_id IS NOT NULL THEN
      SELECT organization_id INTO v_phone_record
      FROM phone_numbers
      WHERE provider_phone_id = NEW.phone_number_id
      LIMIT 1;
      
      IF v_phone_record IS NOT NULL THEN
        v_organization_id := v_phone_record.organization_id;
      END IF;
    END IF;
    
    -- If still not found, try by actual phone number
    IF v_organization_id IS NULL AND NEW.to_number IS NOT NULL THEN
      SELECT organization_id INTO v_phone_record
      FROM phone_numbers
      WHERE phone_number = NEW.to_number
         OR phone_number = REPLACE(REPLACE(REPLACE(NEW.to_number, ' ', ''), '-', ''), '(', '')
         OR phone_number = '+' || REPLACE(REPLACE(REPLACE(NEW.to_number, ' ', ''), '-', ''), '(', '')
      LIMIT 1;
      
      IF v_phone_record IS NOT NULL THEN
        v_organization_id := v_phone_record.organization_id;
      END IF;
    END IF;
  END IF;

  -- If we still don't have an organization, mark as error
  IF v_organization_id IS NULL THEN
    UPDATE vapi_call_events
    SET processed = true,
        processed_at = NOW(),
        error_message = 'Could not identify organization for call'
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- Determine call direction
  v_direction := COALESCE(NEW.direction, 
    CASE 
      WHEN NEW.metadata->>'direction' IS NOT NULL THEN NEW.metadata->>'direction'
      ELSE 'inbound'
    END
  );

  -- Create or update call record
  INSERT INTO calls (
    organization_id,
    direction,
    provider_call_id,
    from_number,
    to_number,
    status,
    duration_seconds,
    recording_url,
    transcript,
    summary,
    raw_payload
  ) VALUES (
    v_organization_id,
    v_direction,
    NEW.call_id,
    NEW.from_number,
    NEW.to_number,
    CASE NEW.status
      WHEN 'ended' THEN 'completed'
      WHEN 'in-progress' THEN 'answered'
      ELSE COALESCE(NEW.status, 'completed')
    END,
    NEW.duration_seconds,
    NEW.recording_url,
    NEW.transcript,
    NEW.summary,
    NEW.raw_data
  )
  ON CONFLICT (provider_call_id) 
  DO UPDATE SET
    status = EXCLUDED.status,
    duration_seconds = EXCLUDED.duration_seconds,
    recording_url = EXCLUDED.recording_url,
    transcript = EXCLUDED.transcript,
    summary = EXCLUDED.summary,
    raw_payload = EXCLUDED.raw_payload
  RETURNING id INTO v_call_id;

  -- For inbound calls, create a lead if it doesn't exist
  IF v_direction = 'inbound' AND NEW.from_number IS NOT NULL THEN
    v_lead_phone := NEW.from_number;
    
    -- Check if lead already exists
    SELECT id INTO v_lead_id
    FROM leads
    WHERE organization_id = v_organization_id
      AND phone = v_lead_phone
    LIMIT 1;

    -- Create new lead if doesn't exist
    IF v_lead_id IS NULL THEN
      INSERT INTO leads (
        organization_id,
        phone,
        name,
        status,
        source,
        notes
      ) VALUES (
        v_organization_id,
        v_lead_phone,
        COALESCE(NEW.metadata->>'name', NULL),
        'new',
        'inbound',
        COALESCE(NEW.summary, 'Inbound call')
      )
      RETURNING id INTO v_lead_id;
    ELSE
      -- Update existing lead
      UPDATE leads
      SET notes = COALESCE(notes || E'\n', '') || 'Inbound call: ' || COALESCE(NEW.summary, '')
      WHERE id = v_lead_id;
    END IF;

    -- Link call to lead
    IF v_call_id IS NOT NULL AND v_lead_id IS NOT NULL THEN
      UPDATE calls
      SET lead_id = v_lead_id
      WHERE id = v_call_id;
    END IF;
  END IF;

  -- Mark event as processed
  UPDATE vapi_call_events
  SET processed = true,
      processed_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically process new Vapi call events
CREATE TRIGGER process_vapi_call_event_trigger
  AFTER INSERT ON vapi_call_events
  FOR EACH ROW
  EXECUTE FUNCTION process_vapi_call_event();

-- Grant necessary permissions
GRANT INSERT ON vapi_call_events TO service_role;
GRANT SELECT ON vapi_call_events TO authenticated;

COMMENT ON TABLE vapi_call_events IS 'Table for Vapi Supabase integration - Vapi writes call data here, triggers process it automatically';
COMMENT ON FUNCTION process_vapi_call_event() IS 'Automatically processes Vapi call events and creates calls/leads in the system';

