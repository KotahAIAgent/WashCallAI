-- Create phone_number_catalog table for available phone numbers for purchase
CREATE TABLE IF NOT EXISTS phone_number_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  phone_number TEXT NOT NULL UNIQUE,
  provider_phone_id TEXT NOT NULL UNIQUE,
  area_code TEXT,
  state TEXT,
  city TEXT,
  price_cents INTEGER NOT NULL, -- Price in cents
  available BOOLEAN DEFAULT true,
  purchased_by_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  purchased_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb -- Store additional info like capabilities, features, etc.
);

-- Create index for faster lookups (drop if exists to avoid conflicts)
DROP INDEX IF EXISTS idx_phone_catalog_available;
DROP INDEX IF EXISTS idx_phone_catalog_area_code;
DROP INDEX IF EXISTS idx_phone_catalog_state;
CREATE INDEX idx_phone_catalog_available ON phone_number_catalog(available);
CREATE INDEX idx_phone_catalog_area_code ON phone_number_catalog(area_code);
CREATE INDEX idx_phone_catalog_state ON phone_number_catalog(state);

-- Create phone_number_purchases table to track purchases
CREATE TABLE IF NOT EXISTS phone_number_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number_id UUID NOT NULL REFERENCES phone_number_catalog(id),
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  amount_paid_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  purchased_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster lookups (drop if exists to avoid conflicts)
DROP INDEX IF EXISTS idx_phone_purchases_organization;
DROP INDEX IF EXISTS idx_phone_purchases_status;
CREATE INDEX idx_phone_purchases_organization ON phone_number_purchases(organization_id);
CREATE INDEX idx_phone_purchases_status ON phone_number_purchases(status);

-- Add RLS policies for phone_number_catalog (public read for available numbers)
ALTER TABLE phone_number_catalog ENABLE ROW LEVEL SECURITY;

-- Anyone can view available phone numbers
DROP POLICY IF EXISTS "Anyone can view available phone numbers" ON phone_number_catalog;
CREATE POLICY "Anyone can view available phone numbers"
  ON phone_number_catalog FOR SELECT
  USING (available = true);

-- Only service role can manage catalog (insert, update, delete)
-- This will be handled via service role in server actions

-- Add RLS policies for phone_number_purchases
ALTER TABLE phone_number_purchases ENABLE ROW LEVEL SECURITY;

-- Organizations can view their own purchases
DROP POLICY IF EXISTS "Organizations can view their own purchases" ON phone_number_purchases;
CREATE POLICY "Organizations can view their own purchases"
  ON phone_number_purchases FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

