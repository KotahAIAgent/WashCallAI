# Webhook Troubleshooting Guide

## Issue: Webhook Not Being Called

If you see `checkout.session.completed` events in Stripe but no webhook calls in Vercel logs, follow these steps:

---

## Step 1: Verify Webhook is Configured in Stripe

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Check if you have a webhook endpoint configured
3. If you don't see one, you need to create it (see Step 2)
4. If you do see one, click on it to view details

---

## Step 2: Create/Verify Webhook Endpoint

### 2.1: Create New Webhook

1. In Stripe Dashboard → Developers → Webhooks
2. Click **"+ Add endpoint"** (or **"+ Add destination"**)
3. **Endpoint URL**: 
   ```
   https://www.fusioncaller.com/api/auth/stripe/webhook
   ```
   ⚠️ **Important**: Make sure this URL is exactly correct - no trailing slashes!

4. **Description**: `FusionCaller Credits & Subscriptions`

5. **Events to send**: Click **"Select events"** and choose:
   - ✅ `checkout.session.completed` (Required for credits)
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`

6. Click **"Add endpoint"** or **"Save"**

### 2.2: Copy Webhook Signing Secret

1. After creating, click on the webhook endpoint
2. Find **"Signing secret"** section
3. Click **"Reveal"** or **"Click to reveal"**
4. **Copy the secret** (starts with `whsec_`)
5. ⚠️ **Save this immediately** - you can only see it once!

---

## Step 3: Add Webhook Secret to Vercel

1. Go to [Vercel Dashboard](https://vercel.com) → Your Project
2. Click **Settings** → **Environment Variables**
3. Add or update:
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: Paste the webhook secret from Step 2.2 (starts with `whsec_`)
   - **Environment**: Select all (Production, Preview, Development)
4. Click **"Save"**
5. **Redeploy your application** (this is critical!)

---

## Step 4: Test the Webhook

### 4.1: Make a Test Purchase

1. Go to your app's `/app/disputes` page
2. Purchase credits (e.g., 100 minutes for $30)
3. Complete the payment in Stripe Checkout

### 4.2: Check Stripe Webhook Logs

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click the **"Events"** tab
4. Look for `checkout.session.completed` events
5. Click on the most recent one
6. Check the **"Response"** section:
   - ✅ **Success**: Should show `{"received": true}` and status `200`
   - ❌ **Error**: Will show error message and status code

### 4.3: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → **Logs**
2. Filter by time (around when you made the purchase)
3. Look for:
   - POST requests to `/api/auth/stripe/webhook`
   - Log messages like: `✓ Added [X] credits to org [id]`

---

## Step 5: Common Issues & Solutions

### Issue: "Webhook signature verification failed"

**Cause**: Webhook secret doesn't match or is missing

**Solution**:
1. ✅ Verify `STRIPE_WEBHOOK_SECRET` is set in Vercel
2. ✅ Make sure you copied the correct secret (test vs live mode)
3. ✅ Redeploy after adding the secret
4. ✅ Check the secret starts with `whsec_`

### Issue: "404 Not Found" in Stripe webhook logs

**Cause**: Webhook URL is incorrect

**Solution**:
1. ✅ Verify URL is exactly: `https://www.fusioncaller.com/api/auth/stripe/webhook`
2. ✅ No trailing slash
3. ✅ Using `https://` not `http://`
4. ✅ Domain is correct (check your actual domain)

### Issue: Webhook shows "No events sent"

**Cause**: Events not selected in webhook configuration

**Solution**:
1. ✅ Go to webhook endpoint settings
2. ✅ Click **"Select events"**
3. ✅ Make sure `checkout.session.completed` is checked
4. ✅ Save the webhook

### Issue: Webhook called but credits not added

**Cause**: Metadata missing or incorrect

**Solution**:
1. ✅ Check Stripe event details - expand the JSON
2. ✅ Look for `metadata` object:
   ```json
   "metadata": {
     "organization_id": "...",
     "purchase_type": "credits",
     "minutes": "100"
   }
   ```
3. ✅ If metadata is missing, the checkout session wasn't created correctly
4. ✅ Check `/api/auth/stripe/checkout-credits` endpoint logs

### Issue: Webhook not being called at all

**Possible Causes**:
1. Webhook endpoint not created
2. Webhook URL incorrect
3. Webhook disabled
4. Events not selected

**Solution**:
1. ✅ Verify webhook exists in Stripe Dashboard
2. ✅ Check webhook status (should be "Enabled")
3. ✅ Verify webhook URL is correct
4. ✅ Make sure `checkout.session.completed` event is selected
5. ✅ Try clicking **"Send test webhook"** in Stripe to test

---

## Step 6: Manual Test

You can manually trigger a test webhook from Stripe:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"** button
4. Select event type: `checkout.session.completed`
5. Click **"Send test webhook"**
6. Check Vercel logs to see if it was received

---

## Step 7: Verify Credits Were Added

After webhook processes successfully:

1. **Check Database**:
   - Go to Supabase Dashboard
   - Open `organizations` table
   - Find your organization
   - Check `purchased_credits_minutes` column
   - Should show the minutes you purchased

2. **Check UI**:
   - Go to `/app/disputes` page
   - Look at "Remaining Minutes" card
   - Should show your purchased credits

---

## Quick Checklist

- [ ] Webhook endpoint created in Stripe
- [ ] Webhook URL is correct: `https://www.fusioncaller.com/api/auth/stripe/webhook`
- [ ] `checkout.session.completed` event is selected
- [ ] Webhook signing secret copied
- [ ] `STRIPE_WEBHOOK_SECRET` added to Vercel
- [ ] Application redeployed after adding secret
- [ ] Test purchase completed
- [ ] Webhook event shows in Stripe Dashboard
- [ ] Webhook response shows success in Stripe
- [ ] POST request to `/api/auth/stripe/webhook` in Vercel logs
- [ ] Credits added to database

---

## Still Not Working?

If you've checked everything above and it's still not working:

1. **Check Vercel Function Logs**:
   - Go to Vercel → Your Project → Functions
   - Look for `/api/auth/stripe/webhook` function
   - Check for any errors

2. **Check Stripe Webhook Attempts**:
   - In Stripe webhook details, check "Attempts" tab
   - See if there are failed attempts
   - Check error messages

3. **Verify Environment Variables**:
   - Make sure `STRIPE_SECRET_KEY` is set
   - Make sure `STRIPE_WEBHOOK_SECRET` is set
   - Make sure both are for the same mode (test or live)

4. **Test the Endpoint Directly**:
   - Try making a POST request to your webhook URL
   - Should return an error about missing signature (this confirms endpoint is accessible)

---

**Last Updated**: December 2024

