# Complete Stripe Setup Guide - Start Receiving Payments

This guide will walk you through connecting Stripe to your website so you can receive payments when customers subscribe.

## ✅ What's Already Built

Your website already has:
- ✅ Checkout flow (when users click "Upgrade")
- ✅ Subscription management
- ✅ Setup fee handling
- ✅ Webhook handlers for payment events
- ✅ Customer portal for billing management

**You just need to configure Stripe!**

---

## Step 1: Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click **"Sign up"** or **"Start now"**
3. Create your account (use your business email)
4. Complete business verification (they'll ask for business details)

---

## Step 2: Get Your API Keys

### Test Mode (For Testing)

1. In Stripe Dashboard, make sure you're in **"Test mode"** (toggle in top right)
2. Go to **Developers** → **API keys**
3. Copy these keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - Click "Reveal test key"

### Live Mode (For Real Payments)

1. Switch to **"Live mode"** (toggle in top right)
2. Complete business verification if prompted
3. Go to **Developers** → **API keys**
4. Copy these keys:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`) - Click "Reveal live key"

---

## Step 3: Create Products & Prices in Stripe

You need to create 6 products in Stripe (3 subscription plans + 3 setup fees).

### Create Subscription Plans

#### Starter Plan ($149/month)

1. Go to **Products** → **Add product**
2. Fill in:
   - **Name**: `Starter Plan`
   - **Description**: `Perfect for getting started with AI-powered inbound calls`
   - **Pricing model**: `Recurring`
   - **Price**: `$149.00`
   - **Billing period**: `Monthly`
3. Click **"Save product"**
4. **Copy the Price ID** (starts with `price_`) - You'll need this!

#### Growth Plan ($349/month)

1. **Add product** again
2. Fill in:
   - **Name**: `Growth Plan`
   - **Description**: `Scale your business with outbound AI calling`
   - **Pricing model**: `Recurring`
   - **Price**: `$349.00`
   - **Billing period**: `Monthly`
3. Click **"Save product"**
4. **Copy the Price ID**

#### Pro Plan ($699/month)

1. **Add product** again
2. Fill in:
   - **Name**: `Pro Plan`
   - **Description**: `Unlimited power for high-volume operations`
   - **Pricing model**: `Recurring`
   - **Price**: `$699.00`
   - **Billing period**: `Monthly`
3. Click **"Save product"**
4. **Copy the Price ID**

### Create Setup Fee Products (One-time payments)

#### Starter Setup Fee ($99)

1. **Add product**
2. Fill in:
   - **Name**: `Starter Setup Fee`
   - **Description**: `One-time setup fee for Starter plan`
   - **Pricing model**: `One-time`
   - **Price**: `$99.00`
3. Click **"Save product"**
4. **Copy the Price ID**

#### Growth Setup Fee ($149)

1. **Add product**
2. Fill in:
   - **Name**: `Growth Setup Fee`
   - **Description**: `One-time setup fee for Growth plan`
   - **Pricing model**: `One-time`
   - **Price**: `$149.00`
3. Click **"Save product"**
4. **Copy the Price ID**

#### Pro Setup Fee ($199)

1. **Add product**
2. Fill in:
   - **Name**: `Pro Setup Fee`
   - **Description**: `One-time setup fee for Pro plan`
   - **Pricing model**: `One-time`
   - **Price**: `$199.00`
3. Click **"Save product"**
4. **Copy the Price ID**

---

## Step 4: Add Environment Variables

Add these to your Vercel project (or `.env.local` for local development):

### For Test Mode (Testing)

```env
# Stripe Test Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Subscription Price IDs (from Step 3)
STRIPE_STARTER_PRICE_ID=price_your_starter_price_id
STRIPE_GROWTH_PRICE_ID=price_your_growth_price_id
STRIPE_PRO_PRICE_ID=price_your_pro_price_id

# Setup Fee Price IDs (from Step 3)
STRIPE_SETUP_FEE_STARTER_PRICE_ID=price_your_starter_setup_fee_id
STRIPE_SETUP_FEE_GROWTH_PRICE_ID=price_your_growth_setup_fee_id
STRIPE_SETUP_FEE_PRO_PRICE_ID=price_your_pro_setup_fee_id

# App URL (your website URL)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### For Live Mode (Real Payments)

Replace `pk_test_` with `pk_live_` and `sk_test_` with `sk_live_` in your environment variables.

**How to add to Vercel:**
1. Go to your Vercel project
2. Click **Settings** → **Environment Variables**
3. Add each variable one by one
4. Click **"Save"**
5. Redeploy your site

---

## Step 5: Set Up Stripe Webhook

Webhooks tell your website when payments succeed, subscriptions are created, etc.

### Get Webhook Secret

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/auth/stripe/webhook
   ```
   (Replace `your-domain.com` with your actual domain)
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Click **"Add endpoint"**
6. **Copy the "Signing secret"** (starts with `whsec_`)

### Add Webhook Secret to Environment Variables

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Important:** You need separate webhooks for:
- **Test mode**: Use test webhook secret
- **Live mode**: Create another webhook endpoint and use live webhook secret

---

## Step 6: Test the Payment Flow

### Test with Test Cards

1. Make sure you're using **test mode** API keys
2. Go to your pricing page
3. Click "Get Starter" (or any plan)
4. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
5. Complete checkout
6. Check Stripe Dashboard → **Payments** to see the test payment

### Verify It Works

1. **Stripe Dashboard** → **Payments**: Should show test payment
2. **Stripe Dashboard** → **Customers**: Should show new customer
3. **Stripe Dashboard** → **Subscriptions**: Should show active subscription
4. Your website: User should have access to paid features

---

## Step 7: Go Live! 🚀

When you're ready to accept real payments:

1. **Switch to Live Mode** in Stripe Dashboard
2. **Create live products** (repeat Step 3 with live mode)
3. **Update environment variables** with live keys:
   - Replace `pk_test_` → `pk_live_`
   - Replace `sk_test_` → `sk_live_`
   - Update all Price IDs with live price IDs
4. **Create live webhook** (repeat Step 5 with live mode)
5. **Update `STRIPE_WEBHOOK_SECRET`** with live webhook secret
6. **Redeploy** your Vercel site

---

## How Payments Work

### When Customer Subscribes:

1. Customer clicks **"Get Starter"** (or any plan)
2. Redirected to Stripe Checkout
3. Enters payment info
4. **Stripe charges them:**
   - Setup fee: $99/$149/$199 (one-time)
   - Monthly subscription: $149/$349/$699 (recurring)
5. Webhook notifies your website
6. Customer gets access to paid features

### Monthly Billing:

- Stripe automatically charges customers every month
- Webhook updates subscription status
- If payment fails, webhook notifies you

### Where Money Goes:

- **Stripe Dashboard** → **Payments**: See all payments
- **Stripe Dashboard** → **Balance**: Your available balance
- **Stripe Dashboard** → **Payouts**: Money transferred to your bank

---

## Troubleshooting

### "Invalid API key"
- Check you copied the full key (no spaces)
- Make sure test/live keys match your mode

### "Price not found"
- Verify Price IDs are correct in environment variables
- Make sure products exist in Stripe

### "Webhook not working"
- Check webhook URL is correct
- Verify webhook secret in environment variables
- Check Stripe Dashboard → Webhooks → Recent events

### "Payment succeeds but user doesn't get access"
- Check webhook is receiving events
- Check server logs for errors
- Verify webhook handler is working

---

## Quick Checklist

- [ ] Created Stripe account
- [ ] Got API keys (test + live)
- [ ] Created 6 products (3 plans + 3 setup fees)
- [ ] Copied all Price IDs
- [ ] Added environment variables to Vercel
- [ ] Set up webhook endpoint
- [ ] Got webhook secret
- [ ] Tested with test card
- [ ] Verified payment appears in Stripe
- [ ] Ready to go live!

---

## Need Help?

- **Stripe Docs**: [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe Support**: Available in Dashboard
- **Test Cards**: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## 💰 You're Ready to Make Money!

Once set up, every subscription will automatically:
- Charge the customer
- Create recurring billing
- Update their access
- Handle payment failures
- Send you money to your bank account

**Stripe typically transfers money to your bank 2-7 days after payment.**

Good luck! 🚀

