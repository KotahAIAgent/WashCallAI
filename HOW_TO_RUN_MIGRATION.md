# How to Run the Database Migration

## What is Supabase?

Supabase is your PostgreSQL database that stores all your application data (organizations, users, calls, leads, etc.). It's already set up and running - you just need to add the new columns and table.

## Step 1: Access Your Supabase Dashboard

1. **Go to Supabase**: https://supabase.com/dashboard
2. **Sign in** with your Supabase account
3. **Select your project** (the one you're using for FusionCaller)

## Step 2: Open the SQL Editor

1. In your Supabase project dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"** button (top right)

## Step 3: Run the Migration

1. **Copy the entire contents** of this file:
   ```
   supabase/migrations/add-voice-and-prompt-requests.sql
   ```

2. **Paste it** into the SQL Editor in Supabase

3. **Click "Run"** (or press Cmd+Enter / Ctrl+Enter)

4. You should see a success message like:
   ```
   Success. No rows returned
   ```

## What This Migration Does

✅ **Adds 3 new columns** to `agent_configs` table:
- `voice_provider` (defaults to 'elevenlabs')
- `voice_id` (stores the ElevenLabs voice ID)
- `voice_name` (stores the voice name like "Rachel", "Antoni", etc.)

✅ **Creates a new table** `prompt_change_requests`:
- Stores customer requests for prompt changes
- Includes priority levels and status tracking
- Has Row Level Security (RLS) policies for data protection

## Verify It Worked

After running the migration, you can verify it worked by:

1. Go to **"Table Editor"** in Supabase
2. Click on **"agent_configs"** table
3. You should see the new columns: `voice_provider`, `voice_id`, `voice_name`
4. You should also see a new table called **"prompt_change_requests"**

## That's It!

Once the migration is run, your application will be able to:
- Store voice selections for agents
- Accept prompt change requests from customers
- Everything will work automatically!

---

## Troubleshooting

**If you get an error:**
- Make sure you're in the correct Supabase project
- Check that the `agent_configs` table already exists (it should if your app is working)
- The migration uses `IF NOT EXISTS` so it's safe to run multiple times

**If you're not sure which Supabase project:**
- Check your Vercel environment variables for `NEXT_PUBLIC_SUPABASE_URL`
- The URL will look like: `https://xxxxx.supabase.co`
- The `xxxxx` part is your project reference

