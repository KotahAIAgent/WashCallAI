# How to Verify Webhook Delivery for Credits Purchase

Since you see `checkout.session.completed` in Stripe Events, let's verify if the webhook was actually sent and processed.

## Step 1: Check Webhook Endpoint in Stripe

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. **Do you see a webhook endpoint listed?**
   - If **NO**: You need to create one (see Step 2)
   - If **YES**: Click on it to view details

## Step 2: If No Webhook Exists, Create It

1. Click **"+ Add endpoint"** (or **"+ Add destination"**)
2. **Endpoint URL**: `https://www.fusioncaller.com/api/auth/stripe/webhook`
3. **Description**: `FusionCaller Credits & Subscriptions`
4. **Events to send**: Select `checkout.session.completed`
5. Click **"Add endpoint"**
6. **Copy the signing secret** (starts with `whsec_`)
7. Add it to Vercel as `STRIPE_WEBHOOK_SECRET`
8. **Redeploy your app**

## Step 3: Check Webhook Delivery Attempts

If you have a webhook endpoint:

1. Click on the webhook endpoint
2. Go to the **"Events"** tab (or **"Attempts"** tab)
3. Look for the `checkout.session.completed` event from your purchase time
4. Click on it to see:
   - **Status**: Success (200) or Failed (4xx/5xx)
   - **Response**: Should show `{"received": true}` if successful
   - **Error message**: If it failed, you'll see why

## Step 4: Check What You See

### Scenario A: Webhook shows "Success" (200)

✅ **Good!** The webhook was sent and processed.

**Next steps:**
1. Check Vercel logs for: `✓ Added [X] credits to org [id]`
2. Check your database - `purchased_credits_minutes` should be updated
3. If credits aren't showing, check the webhook response body for errors

### Scenario B: Webhook shows "Failed" (4xx/5xx)

❌ **Problem:** The webhook was sent but failed to process.

**Common errors:**
- **401/403**: Webhook secret mismatch
- **404**: Webhook URL incorrect
- **500**: Server error in webhook handler

**Fix:**
1. Check the error message in Stripe webhook details
2. Check Vercel logs for the error
3. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
4. Make sure the webhook URL is exactly: `https://www.fusioncaller.com/api/auth/stripe/webhook`

### Scenario C: No webhook delivery attempt shown

❌ **Problem:** Stripe isn't sending the webhook.

**Possible causes:**
1. Webhook endpoint not created
2. Webhook disabled
3. Event not selected in webhook configuration
4. Webhook URL incorrect

**Fix:**
1. Create/verify webhook endpoint exists
2. Make sure `checkout.session.completed` is selected
3. Verify webhook is enabled (not paused)
4. Check webhook URL is correct

## Step 5: Manual Test

You can manually trigger a test webhook:

1. In Stripe Dashboard → Webhooks → Your endpoint
2. Click **"Send test webhook"**
3. Select event: `checkout.session.completed`
4. Click **"Send test webhook"**
5. Check Vercel logs to see if it was received

## Step 6: Verify Credits in Database

After webhook processes:

1. Go to Supabase Dashboard
2. Open `organizations` table
3. Find your organization (ID: `35f546ac-7144-4d1a-aa51-aecc4f1fcb24`)
4. Check `purchased_credits_minutes` column
5. Should show the minutes you purchased (e.g., 100)

## Quick Checklist

- [ ] Webhook endpoint exists in Stripe
- [ ] `checkout.session.completed` event is selected
- [ ] Webhook URL is correct: `https://www.fusioncaller.com/api/auth/stripe/webhook`
- [ ] `STRIPE_WEBHOOK_SECRET` is set in Vercel
- [ ] App has been redeployed after adding secret
- [ ] Webhook delivery attempt shows in Stripe
- [ ] Webhook response shows success (200)
- [ ] Vercel logs show credits being added
- [ ] Database shows updated `purchased_credits_minutes`

---

**What to tell me:**
1. Do you see a webhook endpoint in Stripe?
2. If yes, what does the delivery attempt show? (Success/Failed)
3. What's the response code? (200, 400, 500, etc.)
4. Any error messages?

This will help me diagnose the exact issue!

