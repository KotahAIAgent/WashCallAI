# One-Step Vapi Webhook Setup

## The Simplest Solution

You already have a webhook endpoint deployed on Vercel! You just need to point Vapi to it.

## Option 1: Use Your Existing Vercel Deployment (Easiest)

Your webhook is already live at:
```
https://your-vercel-domain.vercel.app/api/vapi/webhook
```

### Quick Setup (2 minutes):

1. **Get your Vercel domain:**
   - Go to Vercel Dashboard → Your Project
   - Copy your domain (e.g., `your-app.vercel.app`)

2. **Set webhook URL in Vapi:**
   
   **Via API (recommended):**
   ```bash
   curl -X PATCH https://api.vapi.ai/assistant/YOUR_ASSISTANT_ID \
     -H "Authorization: Bearer YOUR_VAPI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"serverUrl": "https://your-vercel-domain.vercel.app/api/vapi/webhook"}'
   ```
   
   **Or use the automated script:**
   ```bash
   ./scripts/setup-vapi-webhook.sh
   ```
   (Choose option 1 when prompted)

3. **Done!** All calls will now be tracked automatically.

---

## Option 2: Automated Script (Does Everything)

Run this one command:

```bash
./scripts/setup-vapi-webhook.sh
```

The script will:
- ✅ Ask which deployment method you want
- ✅ Get your webhook URL automatically
- ✅ Set it in Vapi via API
- ✅ Test that it's working
- ✅ Give you confirmation

**That's it!** Everything is configured in one go.

---

## What Gets Tracked Automatically

Once configured, the webhook automatically:

✅ **Tracks every call** (inbound & outbound)  
✅ **Creates leads** for inbound calls  
✅ **Stores transcripts** and summaries  
✅ **Links calls to leads**  
✅ **Updates statistics** (total calls, etc.)  
✅ **Stores recording URLs** (if Vapi provides them)  

**No manual steps needed** - it all happens automatically!

---

## Verify It's Working

1. **Make a test call** to your phone number
2. **Check your dashboard:**
   - Calls page should show the call
   - Leads page should show new lead (if inbound)
   - Statistics should update

3. **Check Vercel logs:**
   - Go to Vercel Dashboard → Your Project → Functions → `/api/vapi/webhook`
   - You should see webhook payloads being received

---

## Troubleshooting

### Webhook not receiving calls?

1. **Verify URL is correct:**
   - Test it: `curl -X POST https://your-domain.com/api/vapi/webhook -d '{"test":"data"}'`
   - Should return a response (even if error)

2. **Check Vapi settings:**
   - Make sure webhook URL is set (via API or phone number settings)
   - Check Vapi Dashboard → Logs for webhook delivery errors

3. **Check Vercel logs:**
   - Look for incoming webhook requests
   - Check for any errors

### Still not working?

The webhook might need to be set at the **phone number level** instead of assistant level:
- Go to Vapi Dashboard → Phone Numbers
- Click on your phone number
- Look for "Server URL" or "Webhook URL" field
- Enter your webhook URL there

---

## That's It!

Once the webhook URL is set in Vapi, everything works automatically. No multiple steps, no manual configuration - just set it once and it tracks everything!

