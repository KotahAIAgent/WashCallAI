# Vapi Webhook Setup Guide

## Problem: Webhook Not Receiving Calls

If Vapi isn't sending webhooks when calls are made, the webhook URL needs to be configured in your Vapi assistant settings.

## Webhook Endpoint

Your webhook endpoint is:
```
https://yourdomain.com/api/vapi/webhook
```

Replace `yourdomain.com` with your actual Vercel deployment URL (e.g., `your-app.vercel.app`)

## Setup Steps

### 1. Get Your Webhook URL

**For Production:**
```
https://your-production-domain.com/api/vapi/webhook
```

**For Development/Testing:**
```
https://your-app.vercel.app/api/vapi/webhook
```

### 2. Configure in Vapi Dashboard

**Option A: Via Dashboard UI**

1. Go to your assistant: https://dashboard.vapi.ai/assistants/2d4b6384-4fb2-4f2e-a2bd-c7a6ec3bc0bb
2. Click on the **"Advanced"** tab (not "Settings" or "Webhooks")
3. Look for **"Server URL"** field (Vapi calls it "Server URL", not "Webhook URL")
4. Paste your webhook URL: `https://yourdomain.com/api/vapi/webhook`
5. Select which **Server Messages** (events) you want to receive
6. **Save** the assistant

**Option B: Via API (if UI doesn't show the field)**

If you don't see the Server URL field in the Advanced tab, you can set it via API:

```bash
curl -X PATCH https://api.vapi.ai/assistant/2d4b6384-4fb2-4f2e-a2bd-c7a6ec3bc0bb \
  -H "Authorization: Bearer YOUR_VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "serverUrl": "https://yourdomain.com/api/vapi/webhook"
  }'
```

Replace:
- `YOUR_VAPI_API_KEY` with your actual Vapi API key (from Vapi Dashboard → Settings → API Keys)
- `yourdomain.com` with your actual Vercel domain

### 3. Verify Webhook Events

Make sure these events are enabled (if Vapi has event selection):
- ✅ `call-status-update` or `call-ended`
- ✅ `call-completed`
- ✅ Any status update events

### 4. Test the Webhook

1. Make a test inbound call to your phone number
2. Check your Vercel function logs:
   - Go to Vercel Dashboard → Your Project → Functions
   - Look for `/api/vapi/webhook` function
   - Check the logs for incoming requests

3. You should see logs like:
   ```
   [Webhook] Received payload: {...}
   [Webhook] Looking up organization - phoneNumberId: ... toNumber: ...
   ```

### 5. Troubleshooting

**Still not receiving webhooks?**

1. **Check Vapi Dashboard:**
   - Verify the webhook URL is saved correctly
   - Check if there are any error messages
   - Look for webhook delivery logs in Vapi

2. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Functions → `/api/vapi/webhook`
   - Check if there are any incoming requests
   - Look for errors

3. **Test Webhook Manually:**
   - Use a tool like Postman or curl to test the endpoint:
   ```bash
   curl -X POST https://yourdomain.com/api/vapi/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```
   - You should get a response (even if it's an error about missing data)

4. **Check Vapi Assistant Settings:**
   - Make sure the assistant is **active**
   - Verify the phone number is connected to the assistant
   - Check that the assistant has webhooks enabled

5. **Verify Phone Number Configuration:**
   - In your admin panel, make sure the phone number's `provider_phone_id` matches what Vapi expects
   - The `provider_phone_id` should be the Vapi phone number ID (not the actual phone number)

## Important Notes

- The webhook must be accessible via HTTPS (Vapi won't send to HTTP)
- The webhook URL must be publicly accessible (not localhost)
- Vapi may take a few seconds to send the webhook after a call ends
- Some webhooks are sent in real-time, others are sent when the call completes

## Next Steps

Once webhooks are working, you should see:
1. Calls appearing in your Calls page
2. Leads being created automatically for inbound calls
3. Logs in Vercel showing webhook payloads

If you're still having issues, check the Vercel function logs and share what you see (or don't see) there.

