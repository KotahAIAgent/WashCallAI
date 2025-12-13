# Quick Fix: Credits Webhook Error

## The Problem
The webhook is returning "Organization not found" even though the organization exists. This is because the `purchased_credits_minutes` column doesn't exist in your database yet.

## The Solution
Run this migration in Supabase:

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### Step 2: Run This SQL
```sql
-- Add purchased credits field to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS purchased_credits_minutes INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN organizations.purchased_credits_minutes IS 'Purchased credits in minutes. These persist across billing periods and are used after monthly plan minutes are exhausted.';
```

### Step 3: Click "Run"
You should see: **"Success. No rows returned"**

### Step 4: Verify It Worked
1. Go back to **"Table Editor"**
2. Click on the **"organizations"** table
3. Click the **"Definition"** tab (bottom right)
4. You should now see `purchased_credits_minutes` in the column list

### Step 5: Test Again
1. Try purchasing credits again
2. The webhook should now succeed (200 status instead of 404)
3. Check Vercel logs - should show credits being added

---

## Why This Happened
The webhook tries to query `purchased_credits_minutes` from the organizations table. If that column doesn't exist, the query fails and it looks like the organization doesn't exist.

After running the migration, the webhook will be able to:
- Find the organization ✅
- Read current credits ✅
- Add new credits ✅
- Update the database ✅

