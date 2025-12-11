# Apply Admin Privileges Migration

The `admin_privileges` column is missing from your database. You need to run the migration to add it.

## Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Copy the entire contents of `supabase/migrations/add-admin-privileges.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute the migration

## Option 2: Supabase CLI (If you have it set up)

```bash
# If you have Supabase CLI installed
supabase db push

# Or manually run the migration
psql -h <your-db-host> -U postgres -d postgres -f supabase/migrations/add-admin-privileges.sql
```

## What This Migration Does

This migration adds the following columns to the `organizations` table:
- `admin_granted_plan` - Temporary plan upgrade granted by admin
- `admin_granted_plan_expires_at` - When the admin-granted plan expires
- `admin_granted_plan_notes` - Admin notes about the plan grant
- `admin_privileges` - JSON object with special privileges (e.g., `{"unlimited_calls": true}`)
- `admin_privileges_notes` - Admin notes about privileges

The migration is idempotent (safe to run multiple times) - it checks if columns exist before adding them.

## After Running

After running the migration:
1. Refresh your admin panel page
2. The error should be gone
3. You should be able to grant privileges to organizations

