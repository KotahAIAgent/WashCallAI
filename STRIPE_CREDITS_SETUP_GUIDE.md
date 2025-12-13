# Stripe Credits Purchase Setup Guide

This guide walks you through setting up Stripe to handle credits purchases at $0.30 per minute.

## Overview

The credits system allows customers to purchase minutes that:
- Cost $0.30 per minute
- Never expire
- Are used automatically after monthly plan minutes are exhausted
- Can be purchased in bulk (100, 250, 500, 1000, 2500, 5000 minutes) or custom amounts

## Prerequisites

- Stripe account (test or live mode)
- Access to Stripe Dashboard
- Your Stripe API keys

---

## Step 1: Set Up Stripe Products for Bulk Credit Options

You have two options:
1. **Option A (Recommended)**: Use dynamic pricing (no products needed) - The system calculates price automatically
2. **Option B**: Create pre-defined products for each bulk option

### Option A: Dynamic Pricing (Recommended - No Setup Required!)

**Good news!** The current implementation uses **dynamic pricing**, which means you don't need to create any products in Stripe. The system automatically calculates the price based on the number of minutes selected.

- ✅ No Stripe products to create
- ✅ Works for any custom amount
- ✅ Automatically handles all bulk options
- ✅ Price is calculated as: `minutes × $0.30`

**This option is already configured and ready to use!** Skip to Step 3.

---

### Option B: Create Pre-defined Products (Optional)

If you prefer to have pre-defined products in Stripe for better reporting/analytics, follow these steps:

#### 1.1: Create Product for 100 Minutes

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Click **"+ Add product"**
3. Fill in:
   - **Name**: `100 Minutes Credit`
   - **Description**: `Purchase 100 minutes of call credits. Credits never expire.`
   - **Pricing model**: `One time`
   - **Price**: `$30.00` (100 × $0.30)
   - **Currency**: `USD`
4. Click **"Save product"**
5. **Copy the Price ID** (starts with `price_`) - you'll need this later

#### 1.2: Create Product for 250 Minutes

1. Click **"+ Add product"**
2. Fill in:
   - **Name**: `250 Minutes Credit`
   - **Description**: `Purchase 250 minutes of call credits. Credits never expire.`
   - **Pricing model**: `One time`
   - **Price**: `$75.00` (250 × $0.30)
   - **Currency**: `USD`
3. Click **"Save product"**
4. **Copy the Price ID**

#### 1.3: Create Product for 500 Minutes

1. Click **"+ Add product"**
2. Fill in:
   - **Name**: `500 Minutes Credit`
   - **Description**: `Purchase 500 minutes of call credits. Credits never expire.`
   - **Pricing model**: `One time`
   - **Price**: `$150.00` (500 × $0.30)
   - **Currency**: `USD`
3. Click **"Save product"**
4. **Copy the Price ID**

#### 1.4: Create Product for 1,000 Minutes

1. Click **"+ Add product"**
2. Fill in:
   - **Name**: `1,000 Minutes Credit`
   - **Description**: `Purchase 1,000 minutes of call credits. Credits never expire.`
   - **Pricing model**: `One time`
   - **Price**: `$300.00` (1000 × $0.30)
   - **Currency**: `USD`
3. Click **"Save product"**
4. **Copy the Price ID**

#### 1.5: Create Product for 2,500 Minutes

1. Click **"+ Add product"**
2. Fill in:
   - **Name**: `2,500 Minutes Credit`
   - **Description**: `Purchase 2,500 minutes of call credits. Credits never expire.`
   - **Pricing model**: `One time`
   - **Price**: `$750.00` (2500 × $0.30)
   - **Currency**: `USD`
3. Click **"Save product"**
4. **Copy the Price ID**

#### 1.6: Create Product for 5,000 Minutes

1. Click **"+ Add product"**
2. Fill in:
   - **Name**: `5,000 Minutes Credit`
   - **Description**: `Purchase 5,000 minutes of call credits. Credits never expire.`
   - **Pricing model**: `One time`
   - **Price**: `$1,500.00` (5000 × $0.30)
   - **Currency**: `USD`
3. Click **"Save product"**
4. **Copy the Price ID**

**Note**: If you choose Option B, you'll need to modify the code to use these Price IDs instead of dynamic pricing. The current implementation uses Option A (dynamic pricing), which is simpler and more flexible.

---

## Step 2: Set Up Stripe Webhook for Credits

The webhook is **critical** - it automatically adds credits to customer accounts after successful payment.

### 2.1: Navigate to Webhooks

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"+ Add endpoint"** (or **"+ Add destination"** if you see that button)

### 2.2: Configure Webhook Endpoint

1. **Endpoint URL**: 
   ```
   https://www.fusioncaller.com/api/auth/stripe/webhook
   ```
   (Replace with your actual domain if different)

2. **Description**: `FusionCaller Credits & Subscriptions`

3. **Events to send**: Click **"Select events"** and choose:
   - ✅ `checkout.session.completed` (Required for credits)
   - ✅ `customer.subscription.created` (For subscriptions)
   - ✅ `customer.subscription.updated` (For subscriptions)
   - ✅ `customer.subscription.deleted` (For subscriptions)
   - ✅ `invoice.payment_succeeded` (For subscriptions)

4. Click **"Add endpoint"** or **"Save"**

### 2.3: Copy Webhook Signing Secret

1. After creating the webhook, you'll see the webhook details page
2. Find the **"Signing secret"** section
3. Click **"Reveal"** or **"Click to reveal"**
4. **Copy the secret** (starts with `whsec_`)
5. ⚠️ **Important**: You can only see this secret once when first created. Copy it immediately!

---

## Step 3: Add Environment Variables to Vercel

Add your Stripe credentials to Vercel environment variables:

### 3.1: Navigate to Vercel

1. Go to your project in [Vercel Dashboard](https://vercel.com)
2. Click **Settings** → **Environment Variables**

### 3.2: Add Stripe Keys

Add these environment variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` | Your Stripe Secret Key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | The webhook signing secret from Step 2.3 |
| `NEXT_PUBLIC_APP_URL` | `https://www.fusioncaller.com` | Your app's public URL |

### 3.3: Get Your Stripe API Keys

1. Go to [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/test/apikeys)
2. **Secret key**: Copy the "Secret key" (starts with `sk_test_` for test mode or `sk_live_` for live mode)
3. **Publishable key** (if needed): Copy the "Publishable key" (starts with `pk_test_` or `pk_live_`)

### 3.4: Test Mode vs Live Mode

- **Test Mode**: Use `sk_test_...` keys for testing
- **Live Mode**: Use `sk_live_...` keys for production

⚠️ **Important**: Make sure your webhook secret matches the mode (test or live) of your API keys!

---

## Step 4: Test the Credits Purchase Flow

### 4.1: Test in Test Mode First

1. Make sure you're using test mode API keys
2. Go to your app's `/app/disputes` page
3. Click on a bulk option (e.g., "100 Minutes - $30")
4. You'll be redirected to Stripe Checkout
5. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
6. Complete the payment
7. You should be redirected back to `/app/disputes?credits_purchased=true`
8. Check your database - the organization's `purchased_credits_minutes` should be updated

### 4.2: Verify Webhook is Working

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook endpoint
3. Check the **"Events"** tab
4. You should see `checkout.session.completed` events
5. Click on an event to see the details
6. Check the response - it should show `"received": true`

### 4.3: Check Vercel Logs

1. Go to [Vercel Dashboard → Your Project → Logs](https://vercel.com)
2. Look for log entries like:
   ```
   ✓ Added 100 credits to org [organization-id] (total: 100)
   ```
3. This confirms the webhook is processing correctly

---

## Step 5: Switch to Live Mode (Production)

Once testing is complete:

### 5.1: Switch Stripe to Live Mode

1. Toggle to **"Live mode"** in Stripe Dashboard (top right)
2. Create a new webhook endpoint for live mode (same steps as Step 2)
3. Copy the live mode webhook secret

### 5.2: Update Vercel Environment Variables

1. Go to Vercel → Settings → Environment Variables
2. Update:
   - `STRIPE_SECRET_KEY` → Use `sk_live_...` key
   - `STRIPE_WEBHOOK_SECRET` → Use live mode webhook secret
3. Redeploy your application

### 5.3: Test in Live Mode

1. Make a small test purchase (e.g., 100 minutes)
2. Verify credits are added correctly
3. Monitor webhook events in Stripe Dashboard

---

## Troubleshooting

### Issue: Credits not being added after purchase

**Check:**
1. ✅ Webhook secret is correct in Vercel
2. ✅ Webhook endpoint URL is correct
3. ✅ `checkout.session.completed` event is selected in webhook
4. ✅ Check Vercel logs for errors
5. ✅ Verify webhook is receiving events in Stripe Dashboard

### Issue: "Stripe not configured" error

**Check:**
1. ✅ `STRIPE_SECRET_KEY` is set in Vercel
2. ✅ Key is correct (starts with `sk_test_` or `sk_live_`)
3. ✅ Application has been redeployed after adding env vars

### Issue: Webhook signature verification failed

**Check:**
1. ✅ `STRIPE_WEBHOOK_SECRET` is set correctly
2. ✅ Webhook secret matches the mode (test/live) of your API keys
3. ✅ Webhook endpoint URL is exactly correct (no trailing slashes)

### Issue: Custom amount not working

**Check:**
1. ✅ User entered a valid number (≥ 1)
2. ✅ Check browser console for errors
3. ✅ Verify `/api/auth/stripe/checkout-credits` endpoint is accessible

---

## Pricing Reference

| Minutes | Price | Calculation |
|---------|-------|-------------|
| 100 | $30.00 | 100 × $0.30 |
| 250 | $75.00 | 250 × $0.30 |
| 500 | $150.00 | 500 × $0.30 |
| 1,000 | $300.00 | 1,000 × $0.30 |
| 2,500 | $750.00 | 2,500 × $0.30 |
| 5,000 | $1,500.00 | 5,000 × $0.30 |
| Custom | Variable | `minutes × $0.30` |

---

## Summary Checklist

- [ ] Stripe account created (test mode)
- [ ] Webhook endpoint created with `checkout.session.completed` event
- [ ] Webhook signing secret copied
- [ ] Environment variables added to Vercel:
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `NEXT_PUBLIC_APP_URL`
- [ ] Application redeployed
- [ ] Test purchase completed successfully
- [ ] Credits verified in database
- [ ] Switched to live mode (when ready)
- [ ] Live mode webhook created
- [ ] Live mode environment variables updated
- [ ] Production test completed

---

## Need Help?

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Checkout**: https://stripe.com/docs/payments/checkout
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Test Cards**: https://stripe.com/docs/testing

---

**Last Updated**: December 2024

