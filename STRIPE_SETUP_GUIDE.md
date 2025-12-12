# Stripe Setup Guide - Step by Step

This guide will walk you through connecting your new Stripe account to FusionCaller.

## Prerequisites
- A new Stripe account (business account)
- Access to your Stripe Dashboard
- Access to your Vercel project settings (for environment variables)

## ⚠️ Important: Test Mode vs Live Mode

**You're currently in Sandbox/Test Mode** - this is perfect for setup!

- ✅ **Test Mode (Sandbox)**: Use this to set everything up and test
  - All API keys start with `pk_test_` and `sk_test_`
  - No real money is charged
  - Use test card: `4242 4242 4242 4242` for testing
  - This is where you should start!

- 🔴 **Live Mode**: Switch to this when ready for real customers
  - API keys start with `pk_live_` and `sk_live_`
  - Real money is charged
  - You'll need to create products again in live mode
  - Only switch when everything is tested and working

**For now, stay in Test Mode and complete all the setup steps below.**

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

**Step-by-Step Instructions:**

1. **Go to Products Page**:
   - Log into Stripe Dashboard: https://dashboard.stripe.com
   - Click **"Products"** in the left sidebar
   - You'll see a list of existing products (if any)

2. **Click "Add product"** button (usually in the top right)

3. **Fill in the Product Details**:

#### For Starter Plan Subscription:

**Product Information Section:**
- **Name**: Type `FusionCaller Starter Plan`
- **Description** (optional): `Unlimited inbound AI calls, lead capture, and basic analytics`

**Pricing Section:**
- **Pricing model**: Select **"Recurring"** (this is important - it creates a subscription)
- **Price**: Enter `149.00`
- **Currency**: Select `USD` (United States Dollar)
- **Billing period**: Select **"Monthly"**
- **Usage type**: Leave as **"Licensed"** (default)

**Advanced options** (click to expand if needed):
- **Billing period anchor**: Leave as default
- **Proration behavior**: Leave as default
- **Trial period**: Leave empty (unless you want to offer free trials)

4. **Click "Save product"** (blue button at bottom)

5. **Copy the Price ID**:
   - After saving, you'll see the product page
   - Look for a section showing "Pricing" or "Prices"
   - You'll see a Price ID that looks like: `price_1ABC123xyz...`
   - **Click the copy icon** next to the Price ID
   - **Save this somewhere** - you'll need it for environment variables!

#### For Growth Plan Subscription:

Repeat the same steps with these values:
- **Name**: `FusionCaller Growth Plan`
- **Description**: `Inbound + Outbound AI calls, campaigns, and advanced analytics`
- **Pricing model**: **Recurring**
- **Price**: `349.00`
- **Currency**: `USD`
- **Billing period**: **Monthly**
- **Save and copy the Price ID**

#### For Pro Plan Subscription:

Repeat the same steps with these values:
- **Name**: `FusionCaller Pro Plan`
- **Description**: `Unlimited power for high-volume operations with custom AI and API access`
- **Pricing model**: **Recurring**
- **Price**: `699.00`
- **Currency**: `USD`
- **Billing period**: **Monthly**
- **Save and copy the Price ID**

**Important Notes:**
- Make sure you select **"Recurring"** pricing model (not "One time")
- The Price ID is what you'll use in your code - not the Product ID
- You can find the Price ID later by going to the product and looking at the "Pricing" section

### 2.2 Create Setup Fee Products (One-time charges)

**Step-by-Step Instructions:**

1. **Go to Products Page** (same as before): https://dashboard.stripe.com/products
2. **Click "Add product"** again

#### For Starter Setup Fee:

**Product Information Section:**
- **Name**: `FusionCaller Starter Setup Fee`
- **Description** (optional): `One-time setup fee for Starter plan`

**Pricing Section:**
- **Pricing model**: Select **"One time"** (this is different from subscriptions!)
- **Price**: Enter `99.00`
- **Currency**: Select `USD`
- **Usage type**: Leave as **"Licensed"** (default)

3. **Click "Save product"**
4. **Copy the Price ID** (same process as before)

#### For Growth Setup Fee:

Repeat with:
- **Name**: `FusionCaller Growth Setup Fee`
- **Description**: `One-time setup fee for Growth plan`
- **Pricing model**: **One time**
- **Price**: `149.00`
- **Currency**: `USD`
- **Save and copy the Price ID**

#### For Pro Setup Fee:

Repeat with:
- **Name**: `FusionCaller Pro Setup Fee`
- **Description**: `One-time setup fee for Pro plan`
- **Pricing model**: **One time**
- **Price**: `199.00`
- **Currency**: `USD`
- **Save and copy the Price ID**

**Important Notes:**
- Setup fees use **"One time"** pricing (not "Recurring")
- These are charged once when the customer subscribes
- You'll still get a Price ID for one-time products

---

## Step 3: Set Up Stripe Webhook

The webhook allows Stripe to notify your app about subscription changes.

1. **Go to Webhooks**: 
   - In Stripe Dashboard, click **"Webhooks"** in the left sidebar (under "Workbench" section)
   - Or go directly to: https://dashboard.stripe.com/test/webhooks

2. **Click "+ Add destination" button**:
   - You'll see a large blue button in the center that says **"+ Add destination"**
   - This button is below the text "Trigger reactions in your integration with Stripe events"
   - Click this button

3. **Select "Webhook endpoint"**:
   - You'll see options for different destination types
   - Select **"Webhook endpoint"** (not EventBridge or other options)

4. **Fill in the webhook details**:
   - **Endpoint URL**: Enter:
     ```
     https://www.fusioncaller.com/api/auth/stripe/webhook
     ```
     (Replace `www.fusioncaller.com` with your actual domain if different)
   - **Description** (optional): `FusionCaller Subscription Events`

5. **Select events to listen to**:
   - Click **"Select events"** or **"Add events"**
   - You'll see a list of event types
   - Select these specific events:
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `checkout.session.completed`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
   - Click **"Add events"** or **"Done"** when finished

6. **Save the webhook**:
   - Click **"Add endpoint"** or **"Save"** button at the bottom

7. **Copy the Signing secret**:
   - After creating the webhook, you'll see the webhook details page
   - Look for **"Signing secret"** section
   - Click **"Reveal"** or **"Click to reveal"** to show the secret
   - Copy the secret (starts with `whsec_`) - **you'll need this for environment variables!**
   - ⚠️ **Important**: You can only see this secret once when first created. Copy it immediately!

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

