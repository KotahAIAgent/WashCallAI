# Stripe Setup Guide - Step by Step

This guide will walk you through connecting your new Stripe account to FusionCaller.

## Prerequisites
- A new Stripe account (business account)
- Access to your Stripe Dashboard
- Access to your Vercel project settings (for environment variables)

---

## Step 1: Get Your Stripe API Keys

1. **Log into Stripe Dashboard**: https://dashboard.stripe.com
2. **Go to Developers → API Keys**: 
   - Click on "Developers" in the left sidebar
   - Click on "API keys"
3. **Copy your keys**:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)
   - ⚠️ **IMPORTANT**: Click "Reveal test key" or "Reveal live key" to see the secret key
   - ⚠️ **Keep these keys secure** - never commit them to Git

---

## Step 2: Create Products and Prices in Stripe

You need to create products for each plan (Starter, Growth, Pro) and their setup fees.

### 2.1 Create Subscription Products

1. **Go to Products**: https://dashboard.stripe.com/products
2. **Click "Add product"** for each plan:

#### Starter Plan
- **Name**: `FusionCaller Starter Plan`
- **Description**: `Unlimited inbound AI calls`
- **Pricing Model**: Recurring
- **Price**: `$149.00 USD`
- **Billing Period**: Monthly
- **Click "Save product"**
- **Copy the Price ID** (starts with `price_`) - you'll need this!

#### Growth Plan
- **Name**: `FusionCaller Growth Plan`
- **Description**: `Inbound + Outbound AI calls`
- **Pricing Model**: Recurring
- **Price**: `$349.00 USD`
- **Billing Period**: Monthly
- **Click "Save product"**
- **Copy the Price ID**

#### Pro Plan
- **Name**: `FusionCaller Pro Plan`
- **Description**: `Unlimited power for high-volume operations`
- **Pricing Model**: Recurring
- **Price**: `$699.00 USD`
- **Billing Period**: Monthly
- **Click "Save product"**
- **Copy the Price ID**

### 2.2 Create Setup Fee Products (One-time charges)

1. **Click "Add product"** for each setup fee:

#### Starter Setup Fee
- **Name**: `FusionCaller Starter Setup Fee`
- **Description**: `One-time setup fee for Starter plan`
- **Pricing Model**: One time
- **Price**: `$99.00 USD`
- **Click "Save product"**
- **Copy the Price ID**

#### Growth Setup Fee
- **Name**: `FusionCaller Growth Setup Fee`
- **Description**: `One-time setup fee for Growth plan`
- **Pricing Model**: One time
- **Price**: `$149.00 USD`
- **Click "Save product"**
- **Copy the Price ID**

#### Pro Setup Fee
- **Name**: `FusionCaller Pro Setup Fee`
- **Description**: `One-time setup fee for Pro plan`
- **Pricing Model**: One time
- **Price**: `$199.00 USD`
- **Click "Save product"**
- **Copy the Price ID**

---

## Step 3: Set Up Stripe Webhook

The webhook allows Stripe to notify your app about subscription changes.

1. **Go to Webhooks**: https://dashboard.stripe.com/webhooks
2. **Click "Add endpoint"**
3. **Endpoint URL**: 
   ```
   https://www.fusioncaller.com/api/auth/stripe/webhook
   ```
   (Replace with your actual domain if different)
4. **Description**: `FusionCaller Subscription Events`
5. **Events to send**: Click "Select events" and choose:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. **Click "Add endpoint"**
7. **Copy the Signing secret** (starts with `whsec_`) - you'll need this!

---

## Step 4: Add Environment Variables to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com
2. **Select your project**: `wash-call-ai` (or your project name)
3. **Go to Settings → Environment Variables**
4. **Add the following variables**:

### Required Variables

```
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Plan Price IDs

```
STRIPE_STARTER_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_GROWTH_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
```

### Setup Fee Price IDs

```
STRIPE_SETUP_FEE_STARTER_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_SETUP_FEE_GROWTH_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_SETUP_FEE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
```

5. **Select Environment**: Choose "Production", "Preview", and "Development" (or just Production if you only want it there)
6. **Click "Save"** for each variable
7. **Redeploy your application**: Go to "Deployments" → Click "..." on latest deployment → "Redeploy"

---

## Step 5: Update Local Environment (Optional - for development)

If you're developing locally, also add these to your `.env.local` file:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Plan Price IDs
STRIPE_STARTER_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_GROWTH_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx

# Setup Fee Price IDs
STRIPE_SETUP_FEE_STARTER_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_SETUP_FEE_GROWTH_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_SETUP_FEE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
```

---

## Step 6: Clear Old Stripe Data (Already Done)

✅ The migration `clear-stripe-customer-ids.sql` has been created to remove old Stripe customer IDs.

**To run it:**
1. Go to your Supabase Dashboard
2. Go to SQL Editor
3. Run the migration file: `supabase/migrations/clear-stripe-customer-ids.sql`
4. Or run this SQL directly:
   ```sql
   UPDATE organizations
   SET billing_customer_id = NULL
   WHERE billing_customer_id IS NOT NULL;
   ```

---

## Step 7: Test the Integration

1. **Test Checkout**:
   - Go to your app's pricing page
   - Click "Subscribe" on any plan
   - Complete the Stripe checkout (use test card: `4242 4242 4242 4242`)
   - Verify the subscription is created in Stripe Dashboard

2. **Test Webhook**:
   - Go to Stripe Dashboard → Webhooks
   - Click on your webhook endpoint
   - Check "Recent events" - you should see events coming through
   - If events are failing, check the error messages

3. **Verify Access**:
   - After subscribing, verify the user has access to the app
   - Check that the `plan` field is set in the database
   - Check that `billing_customer_id` is populated

---

## Step 8: Switch to Live Mode (When Ready)

When you're ready to go live:

1. **Get Live Keys**:
   - In Stripe Dashboard, toggle from "Test mode" to "Live mode"
   - Copy your live API keys (starts with `pk_live_` and `sk_live_`)

2. **Create Live Products**:
   - Create the same products in Live mode
   - Copy the live Price IDs

3. **Set Up Live Webhook**:
   - Create a new webhook endpoint for live mode
   - Use the same endpoint URL
   - Copy the live webhook secret

4. **Update Vercel Environment Variables**:
   - Replace all test keys with live keys
   - Replace all test price IDs with live price IDs
   - Redeploy your application

---

## Troubleshooting

### Webhook Not Receiving Events
- Check that the webhook URL is correct and accessible
- Verify the webhook secret is set correctly
- Check Vercel logs for webhook errors
- Make sure you're testing in the correct mode (test vs live)

### Checkout Not Working
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Check browser console for errors
- Verify price IDs are correct

### Subscriptions Not Updating
- Check webhook is receiving events
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check Vercel function logs for webhook processing errors

### Access Not Granted After Payment
- Check that webhook is processing `checkout.session.completed`
- Verify the `plan` field is being updated in the database
- Check Vercel logs for webhook processing

---

## Quick Reference Checklist

- [ ] Stripe account created
- [ ] API keys copied (test mode)
- [ ] 3 subscription products created (Starter, Growth, Pro)
- [ ] 3 setup fee products created
- [ ] All 6 Price IDs copied
- [ ] Webhook endpoint created
- [ ] Webhook secret copied
- [ ] All environment variables added to Vercel
- [ ] Application redeployed
- [ ] Old Stripe customer IDs cleared from database
- [ ] Test checkout completed successfully
- [ ] Webhook receiving events
- [ ] Access granted after payment

---

## Need Help?

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **Check Vercel Logs**: Go to your project → Logs tab

