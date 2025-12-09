# FusionCaller Setup Checklist

## ✅ Already Completed

- [x] Code deployed to Vercel
- [x] Rebranding to FusionCaller complete
- [x] Login/logout functionality fixed
- [x] Admin privileges granted (dakkota@dshpressure.com)
- [x] CRON_SECRET added to Vercel
- [x] Integrations page fixed
- [x] vercel.json created with cron configuration

## 🔧 Still Need to Set Up

### 1. Database Setup (5 minutes)

**Run these SQL migrations in Supabase:**

1. **Credit System Migration** (Required for 6-month credit feature):
   - File: `supabase/migrations/add-credit-system.sql`
   - Go to Supabase Dashboard > SQL Editor
   - Copy/paste and run

2. **Fix Admin Account** (Recommended):
   - File: `supabase/migrations/fix-admin-organization.sql`
   - This will create a profile and organization for your admin account
   - Run this to fix the "No organization found" issue

### 2. Environment Variables in Vercel

**Check these are set in Vercel Dashboard > Settings > Environment Variables:**

**Required:**
- [x] `CRON_SECRET` - ✅ Already added
- [ ] `STRIPE_WEBHOOK_SECRET` - ⏳ Wait until you have domain (see #3)
- [ ] `NEXT_PUBLIC_APP_URL` - Set to your production domain (e.g., `https://fusioncaller.com`)

**Stripe Variables (if not already set):**
- [ ] `STRIPE_SECRET_KEY` - Your Stripe secret key
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- [ ] `STRIPE_STARTER_PRICE_ID` - Starter plan price ID
- [ ] `STRIPE_GROWTH_PRICE_ID` - Growth plan price ID
- [ ] `STRIPE_PRO_PRICE_ID` - Pro plan price ID
- [ ] `STRIPE_SETUP_FEE_STARTER_PRICE_ID` - Starter setup fee price ID
- [ ] `STRIPE_SETUP_FEE_GROWTH_PRICE_ID` - Growth setup fee price ID
- [ ] `STRIPE_SETUP_FEE_PRO_PRICE_ID` - Pro setup fee price ID

**Supabase Variables:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

**Optional (for notifications):**
- [ ] `TWILIO_ACCOUNT_SID` - For SMS notifications
- [ ] `TWILIO_AUTH_TOKEN` - For SMS notifications
- [ ] `TWILIO_PHONE_NUMBER` - Your Twilio phone number
- [ ] `RESEND_API_KEY` or `SENDGRID_API_KEY` - For email notifications
- [ ] `ADMIN_EMAIL` - Email for admin notifications

### 3. Stripe Webhook Setup (10 minutes) ⏳ Wait for Domain

**When you have your production domain:**

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://yourdomain.com/api/auth/stripe/webhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
5. Copy the webhook secret (starts with `whsec_`)
6. Add to Vercel as `STRIPE_WEBHOOK_SECRET`

**For local testing (now):**
- Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/auth/stripe/webhook`
- Use the webhook secret it provides for local testing

### 4. Verify Cron Jobs (2 minutes)

**Check Vercel Dashboard:**
- [ ] Go to Vercel Dashboard > Your Project > Cron Jobs
- [ ] Verify `/api/cron/process-setup-credits` is listed
- [ ] Schedule should be: `0 2 * * *` (daily at 2 AM UTC)

**Note:** Vercel Cron requires Hobby plan or higher. If you don't have that, set up an external cron service.

### 5. Fix Your Admin Account (5 minutes)

**Run this SQL in Supabase:**
- File: `supabase/migrations/fix-admin-organization.sql`
- This creates your profile and organization so integrations page works

### 6. Test Everything (15 minutes)

**Test these features:**
- [ ] Login with dakkota@dshpressure.com
- [ ] Verify admin panel is accessible
- [ ] Check integrations page loads
- [ ] Test logout button
- [ ] Verify pricing pages show credit messaging
- [ ] Test signup flow (create test account)

### 7. Domain Configuration (When Ready)

**Update these when you have fusioncaller.com:**
- [ ] Set `NEXT_PUBLIC_APP_URL` in Vercel to your production domain
- [ ] Update Stripe webhook URL to production domain
- [ ] Update any hardcoded URLs in code (if any)
- [ ] Test production domain works

## 🚨 Critical Items (Do These First)

1. **Database Migration** - Run `add-credit-system.sql`
2. **Fix Admin Account** - Run `fix-admin-organization.sql`
3. **Set NEXT_PUBLIC_APP_URL** - Update to your actual domain in Vercel

## 📋 Quick Reference

**SQL Files to Run:**
- `supabase/migrations/add-credit-system.sql` - Credit system
- `supabase/migrations/fix-admin-organization.sql` - Fix your account

**Vercel Environment Variables:**
- Check: Vercel Dashboard > Settings > Environment Variables

**Stripe Setup:**
- Wait for domain, then set up webhook
- Use Stripe CLI for local testing

**Cron Jobs:**
- Check Vercel Dashboard > Cron Jobs
- Or set up external cron service

## 🎯 Priority Order

1. **Now:** Run database migrations
2. **Now:** Fix admin account (run SQL)
3. **Now:** Set `NEXT_PUBLIC_APP_URL` in Vercel
4. **When you have domain:** Set up Stripe webhook
5. **Verify:** Check cron jobs are active

