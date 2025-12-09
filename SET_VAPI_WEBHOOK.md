# Quick Guide: Set Vapi Webhook URL

## Your Assistant ID
```
2d4b6384-4fb2-4f2e-a2bd-c7a6ec3bc0bb
```

## Method 1: Via Dashboard (Easiest)

1. Go to: https://dashboard.vapi.ai/assistants/2d4b6384-4fb2-4f2e-a2bd-c7a6ec3bc0bb
2. Click the **"Advanced"** tab (at the top)
3. Look for **"Server URL"** field
4. Paste your webhook URL: `https://your-vercel-domain.vercel.app/api/vapi/webhook`
5. **Save**

## Method 2: Via API (If UI doesn't show it)

Run this command in your terminal (replace `YOUR_VAPI_API_KEY` and `your-vercel-domain`):

```bash
curl -X PATCH https://api.vapi.ai/assistant/2d4b6384-4fb2-4f2e-a2bd-c7a6ec3bc0bb \
  -H "Authorization: Bearer YOUR_VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "serverUrl": "https://your-vercel-domain.vercel.app/api/vapi/webhook"
  }'
```

**To get your VAPI_API_KEY:**
1. Go to Vapi Dashboard → Settings → API Keys
2. Copy your API key

**To get your Vercel domain:**
1. Go to Vercel Dashboard → Your Project
2. Copy the domain (e.g., `your-app.vercel.app`)

## Test It

After setting the webhook URL:

1. Visit: `https://your-vercel-domain.vercel.app/api/vapi/webhook` in your browser
   - Should show: `{"message":"Vapi webhook endpoint is active",...}`

2. Make a test call to your phone number

3. Check Vercel logs:
   - Vercel Dashboard → Your Project → Functions → `/api/vapi/webhook`
   - You should see logs starting with `[Webhook] Received payload:`

## Still Not Working?

If you still don't see webhooks:

1. **Check phone number settings** - The webhook might need to be set at the phone number level, not assistant level
2. **Check Vapi documentation** - Settings might have moved: https://docs.vapi.ai/server-url/setting-server-urls
3. **Contact Vapi support** - They can help configure it

