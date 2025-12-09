# Stripe Quick Start - Get Paid in 5 Minutes

## 🚀 Fastest Way to Start

### 1. Create Stripe Account
👉 [https://stripe.com](https://stripe.com) → Sign up

### 2. Get Your Keys (Test Mode)
1. Stripe Dashboard → **Developers** → **API keys**
2. Copy:
   - `pk_test_...` (Publishable key)
   - `sk_test_...` (Secret key)

### 3. Create Products in Stripe

**Quick way:** Use Stripe Dashboard → Products → Add product

| Plan | Monthly Price | Setup Fee | What to Create |
|------|--------------|-----------|----------------|
| Starter | $149 | $99 | 1 subscription product + 1 one-time product |
| Growth | $349 | $149 | 1 subscription product + 1 one-time product |
| Pro | $699 | $199 | 1 subscription product + 1 one-time product |

**For each plan:**
- Create **subscription product** (recurring monthly)
- Create **setup fee product** (one-time payment)
- **Copy the Price ID** for each (starts with `price_`)

### 4. Add to Vercel Environment Variables

Go to Vercel → Your Project → Settings → Environment Variables

Add these (replace with your actual values):

```env
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx

# Subscription Prices
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_GROWTH_PRICE_ID=price_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx

# Setup Fee Prices
STRIPE_SETUP_FEE_STARTER_PRICE_ID=price_xxxxx
STRIPE_SETUP_FEE_GROWTH_PRICE_ID=price_xxxxx
STRIPE_SETUP_FEE_PRO_PRICE_ID=price_xxxxx

# Webhook (get this after Step 5)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Your Website URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 5. Set Up Webhook

1. Stripe Dashboard → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. URL: `https://your-domain.com/api/auth/stripe/webhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
   - `checkout.session.completed`
5. Copy the **Signing secret** (`whsec_...`)
6. Add to Vercel as `STRIPE_WEBHOOK_SECRET`

### 6. Test It!

1. Go to your pricing page
2. Click "Get Starter"
3. Use test card: `4242 4242 4242 4242`
4. Check Stripe Dashboard → Payments (should see test payment)

### 7. Go Live

When ready:
1. Switch Stripe to **Live mode**
2. Create live products (same as test)
3. Get live API keys
4. Update Vercel environment variables with live keys
5. Create live webhook
6. Redeploy!

---

## 💰 Where Your Money Goes

- **Stripe Dashboard** → **Payments**: See all payments
- **Stripe Dashboard** → **Balance**: Your available balance
- **Stripe Dashboard** → **Payouts**: Money sent to your bank

**Payout schedule:** Usually 2-7 days after payment

---

## 📋 Full Guide

See `STRIPE_SETUP_GUIDE.md` for detailed instructions.

---

## ✅ Checklist

- [ ] Stripe account created
- [ ] API keys copied
- [ ] 6 products created (3 plans + 3 setup fees)
- [ ] Price IDs copied
- [ ] Environment variables added to Vercel
- [ ] Webhook created
- [ ] Tested with test card
- [ ] Ready to go live!

---

**That's it! You're ready to accept payments! 🎉**

