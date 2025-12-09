# Vapi Webhook via Supabase Edge Function

## Overview

Since Vapi's Supabase integration is only for storage (recordings), we'll use a **Supabase Edge Function** as the webhook endpoint. This gives us the best of both worlds - hosted by Supabase but processes call data.

## How It Works

```
Vapi Call → Vapi sends webhook → Supabase Edge Function → Processes & saves to database
```

## Setup Steps

### 1. Deploy the Edge Function

The Edge Function is located at: `supabase/functions/vapi-webhook/index.ts`

**Deploy using Supabase CLI:**

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy vapi-webhook
```

**Or deploy via Supabase Dashboard:**
1. Go to Supabase Dashboard → Edge Functions
2. Click "Create a new function"
3. Name it: `vapi-webhook`
4. Copy the code from `supabase/functions/vapi-webhook/index.ts`
5. Deploy

### 2. Get Your Webhook URL

After deployment, your webhook URL will be:
```
https://your-project-ref.supabase.co/functions/v1/vapi-webhook
```

Replace `your-project-ref` with your actual Supabase project reference.

### 3. Configure Vapi Assistant

Since there's no webhook URL field in the assistant settings, you have two options:

**Option A: Set via API (Recommended)**

```bash
curl -X PATCH https://api.vapi.ai/assistant/YOUR_ASSISTANT_ID \
  -H "Authorization: Bearer YOUR_VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "serverUrl": "https://your-project-ref.supabase.co/functions/v1/vapi-webhook"
  }'
```

**Option B: Check Phone Number Settings**

Sometimes the webhook URL is set at the phone number level, not assistant level:
1. Go to Vapi Dashboard → Phone Numbers
2. Click on your phone number
3. Look for "Server URL" or "Webhook URL" field
4. Enter: `https://your-project-ref.supabase.co/functions/v1/vapi-webhook`

### 4. Test the Webhook

1. **Test the endpoint directly:**
   ```bash
   curl -X POST https://your-project-ref.supabase.co/functions/v1/vapi-webhook \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

2. **Make a test call** to your phone number

3. **Check Supabase logs:**
   - Go to Supabase Dashboard → Edge Functions → vapi-webhook → Logs
   - You should see webhook payloads being received

4. **Check your database:**
   ```sql
   SELECT * FROM calls ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM leads ORDER BY created_at DESC LIMIT 5;
   ```

## Environment Variables

The Edge Function automatically uses:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for bypassing RLS)

These are automatically available in Supabase Edge Functions, no configuration needed!

## Advantages

✅ **Hosted by Supabase** - No need for separate webhook server  
✅ **Automatic scaling** - Handles high call volumes  
✅ **Direct database access** - Fast processing  
✅ **Works for all assistants** - One endpoint handles everything  
✅ **Free tier available** - Supabase Edge Functions have generous free tier  

## Monitoring

### Check Function Logs

1. Go to Supabase Dashboard → Edge Functions → vapi-webhook
2. Click "Logs" tab
3. See real-time webhook processing

### Check Database

```sql
-- Recent calls
SELECT * FROM calls ORDER BY created_at DESC LIMIT 10;

-- Recent leads from inbound calls
SELECT * FROM leads WHERE source = 'inbound' ORDER BY created_at DESC LIMIT 10;

-- Calls without organization (errors)
SELECT * FROM calls WHERE organization_id IS NULL;
```

## Troubleshooting

### Webhook Not Receiving Calls

1. **Verify URL is correct:**
   - Check Vapi assistant/phone number settings
   - Make sure URL is: `https://your-project-ref.supabase.co/functions/v1/vapi-webhook`

2. **Check Vapi logs:**
   - Go to Vapi Dashboard → Logs
   - Look for webhook delivery errors

3. **Test endpoint:**
   ```bash
   curl -X POST https://your-project-ref.supabase.co/functions/v1/vapi-webhook \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

### Organization Not Found

If calls are being created but `organization_id` is null:

1. **For inbound calls:**
   - Make sure phone number is in `phone_numbers` table
   - Verify `provider_phone_id` matches Vapi's phone number ID

2. **For outbound calls:**
   - Make sure you're passing `organizationId` in metadata when making calls

### Function Errors

Check Supabase Edge Function logs:
1. Go to Supabase Dashboard → Edge Functions → vapi-webhook → Logs
2. Look for error messages
3. Check function invocations count

## Next Steps

1. Deploy the Edge Function
2. Get your webhook URL
3. Configure Vapi (via API or phone number settings)
4. Test with a call
5. Monitor logs and database

This solution scales to 100+ assistants automatically! 🚀

