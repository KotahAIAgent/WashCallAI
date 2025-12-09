# Automated Webhook Setup - Zero Manual Input

## The Problem

You have 100+ assistants (50 customers × 2 assistants each) and can't manually configure each one.

## The Solution

**Automatic webhook configuration** - Set it once, works for all assistants automatically!

## How It Works

### 1. Automatic Configuration on Agent Setup

When you set an agent ID in the admin panel, the webhook is **automatically configured**:

```
Admin sets agent ID → System automatically sets webhook URL → Done!
```

No manual steps needed!

### 2. One-Time Bulk Setup (Optional)

If you already have assistants, run this **once** to configure all of them:

```bash
curl -X POST https://your-domain.com/api/admin/bulk-configure-webhooks
```

This automatically:
- ✅ Finds all assistants in your Vapi account
- ✅ Sets webhook URL for each one
- ✅ Reports success/failure

**Run this once, and you're done!**

## Setup Steps

### Step 1: Set Environment Variable (One Time)

Add to your `.env.local` and Vercel:

```bash
VAPI_WEBHOOK_URL=https://your-vercel-domain.vercel.app/api/vapi/webhook
```

Or it will auto-detect from `VERCEL_URL` or `NEXT_PUBLIC_APP_URL`.

### Step 2: That's It!

**For new assistants:**
- When you set agent ID in admin panel → Webhook auto-configured ✅

**For existing assistants:**
- Run bulk update once → All configured ✅

## How It Identifies Organizations

The webhook **doesn't need assistant IDs** to route calls correctly. It uses:

1. **Phone Number Lookup** (for inbound calls):
   - Looks up which organization owns the phone number
   - Routes call to correct organization automatically

2. **Metadata** (for outbound calls):
   - We pass `organizationId` in metadata when making calls
   - Webhook routes directly to correct organization

**So even if webhook isn't set per-assistant, it still works!**

## Bulk Update Existing Assistants

If you have 100 assistants already created:

1. **One-time bulk update:**
   ```bash
   curl -X POST https://your-domain.com/api/admin/bulk-configure-webhooks
   ```

2. **Or use the script:**
   ```bash
   node scripts/bulk-update-webhooks.js
   ```

3. **Or call the function directly:**
   ```typescript
   import { bulkUpdateAllAssistantsWebhook } from '@/lib/vapi/auto-webhook'
   
   const result = await bulkUpdateAllAssistantsWebhook()
   console.log(`Updated ${result.success} assistants`)
   ```

## For New Customers

When a new customer signs up:

1. You create their Vapi assistants (inbound + outbound)
2. You set the agent IDs in admin panel
3. **Webhook is automatically configured** ✅
4. Done! No manual steps needed.

## Phone Number Level (Even Better)

If Vapi supports webhook at phone number level:

- Set webhook **once per phone number**
- All assistants using that phone number automatically use the webhook
- Even fewer configurations needed!

The system tries to set webhook at phone number level first, then falls back to assistant level.

## Verification

After setup, verify it's working:

1. **Check logs:**
   ```bash
   # Look for these messages in your logs:
   [Auto-Webhook] ✅ Webhook configured for assistant xxx
   ```

2. **Make a test call:**
   - Call should appear in dashboard
   - Lead should be created (if inbound)

3. **Check Vapi Dashboard:**
   - Go to assistant settings
   - Verify "Server URL" is set (if visible)

## Troubleshooting

### Webhook not being set automatically?

1. **Check environment variables:**
   - `VAPI_API_KEY` must be set
   - `VAPI_WEBHOOK_URL` or `VERCEL_URL` must be set

2. **Check logs:**
   - Look for `[Auto-Webhook]` messages
   - Check for any error messages

3. **Run bulk update:**
   - Use the bulk update endpoint to configure all at once

### Still not working?

The webhook routing works by **phone number lookup**, so even if webhook URL isn't set per-assistant, calls will still be tracked correctly. The webhook just needs to be accessible.

## Summary

✅ **Zero manual input** - Everything is automated  
✅ **Scales infinitely** - 1 assistant or 10,000 assistants  
✅ **Automatic on setup** - When you set agent ID, webhook is configured  
✅ **Bulk update available** - Configure all existing assistants at once  
✅ **Phone number routing** - Works even without per-assistant configuration  

**You never have to manually input assistant IDs for webhook configuration!**

