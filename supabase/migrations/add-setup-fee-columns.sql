-- Migration: Add setup fee refund tracking columns to organizations table
-- Date: 2024-01-XX
-- Description: Adds columns to track setup fee refunds for trial cancellations

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS setup_fee_refunded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_fee_refunded_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN organizations.setup_fee_refunded IS 'Tracks if setup fee has been refunded (for trial cancellations)';
COMMENT ON COLUMN organizations.setup_fee_refunded_at IS 'Timestamp when setup fee was refunded';

