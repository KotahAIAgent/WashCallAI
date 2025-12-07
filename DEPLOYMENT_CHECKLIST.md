# Deployment Checklist: 6-Month Credit System

Use this checklist to ensure all steps are completed before going live.

## Pre-Deployment

### Database
- [ ] Run migration: `supabase/migrations/add-credit-system.sql`
- [ ] Verify columns exist: `account_credit`, `setup_fee_credited`, `setup_fee_credited_at`, `subscription_started_at`
- [ ] For existing subscriptions, manually set `subscription_started_at` to their actual subscription start date

### Environment Variables
- [ ] `STRIPE_WEBHOOK_SECRET` added to production (get from Stripe Dashboard)
- [ ] `CRON_SECRET` generated and added (use `openssl rand -hex 32`)
- [ ] All existing Stripe variables present
- [ ] Variables added to Vercel project settings

### Code
- [ ] All changes committed to git
- [ ] `vercel.json` created with cron configuration
- [ ] No linter errors
- [ ] Code reviewed

## Stripe Configuration

### Webhook Setup
- [ ] Webhook endpoint created: `https://yourdomain.com/api/auth/stripe/webhook`
- [ ] Events subscribed:
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `invoice.payment_succeeded`
- [ ] Webhook secret copied to `STRIPE_WEBHOOK_SECRET`
- [ ] Webhook tested with Stripe CLI or test events

## Cron Jobs

### Vercel Cron (if using)
- [ ] Vercel Hobby plan or higher confirmed
- [ ] `vercel.json` includes cron configuration
- [ ] Cron job appears in Vercel Dashboard > Cron Jobs

### External Cron (if using)
- [ ] Cron service account created
- [ ] Endpoint configured: `https://yourdomain.com/api/cron/process-setup-credits`
- [ ] Authorization header set: `Bearer YOUR_CRON_SECRET`
- [ ] Schedule set: Daily at 2 AM UTC
- [ ] Test run successful

## Testing

### Webhook Testing
- [ ] Test `customer.subscription.created` event
- [ ] Verify `subscription_started_at` is set in database
- [ ] Test `customer.subscription.updated` event
- [ ] Check webhook logs in Stripe Dashboard

### Credit Processing Testing
- [ ] Create test organization with subscription
- [ ] Manually set `subscription_started_at` to 6+ months ago
- [ ] Run cron job manually or wait for scheduled run
- [ ] Verify:
  - [ ] `account_credit` updated correctly
  - [ ] `setup_fee_credited` set to true
  - [ ] Notification created
  - [ ] Stripe customer balance updated (check Stripe Dashboard)

### UI Testing
- [ ] Pricing pages show "Credited back after 6 months" messaging
- [ ] Settings > Billing shows credit balance (if credit exists)
- [ ] Credit component displays correctly

## Post-Deployment

### Monitoring
- [ ] Set up alerts for cron job failures
- [ ] Monitor Stripe webhook delivery in Stripe Dashboard
- [ ] Check Vercel logs for any errors
- [ ] Verify first cron run executes successfully

### Documentation
- [ ] README updated with credit feature info
- [ ] Team notified of new feature
- [ ] Customer support briefed on credit system

## Rollback Plan

If issues occur:
1. [ ] Disable cron job (remove from vercel.json or external service)
2. [ ] Disable webhook events in Stripe Dashboard
3. [ ] Monitor for any data inconsistencies
4. [ ] Database rollback (if needed) - see plan document

## Support Contacts

- **Stripe Issues**: Check Stripe Dashboard > Webhooks > Logs
- **Cron Issues**: Check Vercel logs or external cron service logs
- **Database Issues**: Check Supabase logs

