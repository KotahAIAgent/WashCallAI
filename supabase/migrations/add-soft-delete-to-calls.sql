-- Add soft delete field to calls table
-- This prevents deletion from affecting billing history
ALTER TABLE calls 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add index for faster queries filtering out deleted calls
CREATE INDEX IF NOT EXISTS idx_calls_deleted_at ON calls(deleted_at) WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON COLUMN calls.deleted_at IS 'Timestamp when call was soft deleted. NULL means not deleted. Deleted calls are still counted for billing purposes.';

