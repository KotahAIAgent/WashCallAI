# How to Run Database Migrations

The error "Failed to fetch organization" means the `purchased_credits_minutes` column doesn't exist in your database yet. You need to run the migration.

## Step 1: Go to Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"SQL Editor"** in the left sidebar

## Step 2: Run the Credits Migration

1. Click **"New query"**
2. Copy and paste this SQL:

```sql
-- Add purchased credits field to organizations table
-- Credits are purchased minutes that persist across billing periods
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS purchased_credits_minutes INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN organizations.purchased_credits_minutes IS 'Purchased credits in minutes. These persist across billing periods and are used after monthly plan minutes are exhausted.';
```

3. Click **"Run"** (or press Cmd/Ctrl + Enter)
4. You should see: "Success. No rows returned"

## Step 3: Run the Soft Delete Migration (if needed)

Also run this to add soft delete for calls:

```sql
-- Add soft delete field to calls table
-- This prevents deletion from affecting billing history
ALTER TABLE calls 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add index for faster queries filtering out deleted calls
CREATE INDEX IF NOT EXISTS idx_calls_deleted_at ON calls(deleted_at) WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON COLUMN calls.deleted_at IS 'Timestamp when call was soft deleted. NULL means not deleted. Deleted calls are still counted for billing purposes.';
```

## Step 4: Run the Call Disputes Table Migration (if needed)

If you're getting errors about `call_disputes` table:

```sql
-- Create call_disputes table for customers to request review of charged calls
-- This is an idempotent migration - safe to run multiple times

DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'call_disputes') THEN
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

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_call_disputes_organization_id ON call_disputes(organization_id);
    CREATE INDEX IF NOT EXISTS idx_call_disputes_status ON call_disputes(status);
    CREATE INDEX IF NOT EXISTS idx_call_disputes_call_id ON call_disputes(call_id);
    CREATE INDEX IF NOT EXISTS idx_call_disputes_campaign_contact_id ON call_disputes(campaign_contact_id);
    CREATE INDEX IF NOT EXISTS idx_call_disputes_created_at ON call_disputes(created_at DESC);

    -- Enable Row Level Security
    ALTER TABLE call_disputes ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
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

    RAISE NOTICE 'call_disputes table created successfully';
  ELSE
    RAISE NOTICE 'call_disputes table already exists, skipping creation';
  END IF;
END $$;
```

## Step 5: Verify Migrations Ran Successfully

1. Go to **"Table Editor"** in Supabase
2. Click on the **"organizations"** table
3. Check if you see the **"purchased_credits_minutes"** column
4. It should show `0` as the default value

## Step 6: Test Again

After running the migrations:

1. Make another test purchase
2. Check Stripe webhook delivery - should show success (200) now
3. Check Vercel logs - should show credits being added
4. Check database - `purchased_credits_minutes` should be updated

---

**Quick Checklist:**
- [ ] Run `add-credits-to-organizations.sql` migration
- [ ] Run `add-soft-delete-to-calls.sql` migration (if needed)
- [ ] Run `create-call-disputes-table.sql` migration (if needed)
- [ ] Verify columns exist in Supabase Table Editor
- [ ] Test purchase again
- [ ] Check webhook succeeds

