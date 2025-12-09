-- Add unique constraint on provider_call_id to support upsert operations
-- This allows the webhook to update existing calls when Vapi sends multiple events for the same call
-- Note: PostgreSQL unique constraints allow multiple NULL values, which is fine for our use case

-- First, ensure we don't have duplicate non-null provider_call_ids
-- If duplicates exist, we'll need to handle them manually
DO $$
BEGIN
  -- Check for duplicates and log them (won't fail if none exist)
  IF EXISTS (
    SELECT provider_call_id, COUNT(*) 
    FROM calls 
    WHERE provider_call_id IS NOT NULL 
    GROUP BY provider_call_id 
    HAVING COUNT(*) > 1
  ) THEN
    RAISE NOTICE 'Warning: Duplicate provider_call_ids found. Please resolve before adding constraint.';
  END IF;
END $$;

-- Add unique constraint (allows multiple NULLs)
ALTER TABLE calls 
ADD CONSTRAINT calls_provider_call_id_unique UNIQUE (provider_call_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calls_provider_call_id ON calls(provider_call_id) WHERE provider_call_id IS NOT NULL;

