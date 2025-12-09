# Vapi to Stripe Integration - Simple Setup Guide

This integration automatically charges customers for Vapi calls that exceed their plan limits via Stripe.

## How It Works

1. **Call Tracking**: When a Vapi call completes, the webhook tracks it
2. **Overage Detection**: Checks if the call exceeds the customer's plan limits
3. **Stripe Charge**: Creates a Stripe invoice item for overage calls
4. **Automatic Billing**: Invoice items are included in the next monthly invoice

## Setup Steps

### 1. No Code Changes Needed! ✅

The integration is already implemented. Just configure your call rates below.

### 2. Configure Call Rates (Optional)

Edit `src/lib/vapi/stripe-billing.ts` to customize:

```typescript
const callCostPerMinute = isOverage 
  ? 0.15 // $0.15/min for overage calls
  : 0.10 // $0.10/min for included calls (optional)
```

**Default Settings:**
- **Overage calls**: $0.15 per minute
- **Included calls**: Free (only overage is charged)

### 3. How It Charges

- **Starter Plan**: 0 outbound calls included → All outbound calls charged
- **Growth Plan**: 500 calls/month included → Calls 501+ are charged
- **Pro Plan**: 2,500 calls/month included → Calls 2,501+ are charged
- **Inbound calls**: Always free (unlimited)

### 4. What Gets Charged

Only **billable calls** are charged:
- ✅ Answered calls
- ✅ Interested leads
- ✅ Callback requests
- ✅ Completed calls

**NOT charged:**
- ❌ Voicemails
- ❌ No answer
- ❌ Wrong number
- ❌ Failed calls

### 5. Viewing Charges

Charges appear as **invoice items** in Stripe:
- Go to Stripe Dashboard → Customers → Select customer
- View "Upcoming invoice" to see pending charges
- Charges are included in the next monthly invoice

## Testing

1. Make a test call that exceeds plan limits
2. Check Stripe Dashboard → Customers → Your customer
3. Look for invoice items with description: "Vapi outbound call (X min) - Overage charge"

## Customization

### Change Overage Rate

Edit `src/lib/vapi/stripe-billing.ts`:

```typescript
const callCostPerMinute = isOverage 
  ? 0.25 // Change to $0.25/min
  : 0.10
```

### Charge for All Calls (Not Just Overage)

Edit `src/lib/vapi/stripe-billing.ts`:

```typescript
// Remove the isOverage check
if (!isOverage) {
  return { success: true, message: 'Call within plan limits, no charge' }
}
```

### Different Rates for Inbound vs Outbound

```typescript
const callCostPerMinute = callDirection === 'inbound'
  ? 0.05 // $0.05/min for inbound
  : (isOverage ? 0.15 : 0.10) // Outbound rates
```

## Monitoring

Check logs for:
- `✅ Charged $X.XX for overage call` - Successful charge
- `❌ Failed to charge call` - Error (check Stripe API key)

## Troubleshooting

**No charges appearing?**
- Check that `billing_customer_id` is set in `organizations` table
- Verify `STRIPE_SECRET_KEY` is set in environment variables
- Check webhook logs for errors

**Charging too much?**
- Adjust `callCostPerMinute` in `stripe-billing.ts`
- Verify `isOverage` logic is working correctly

**Want to disable?**
- Comment out the charge code in `src/app/api/vapi/webhook/route.ts` around line 340

## That's It! 🎉

Your Vapi calls are now automatically billed through Stripe. No manual work needed!

