# How to Find Your Stripe Price IDs

If you're getting "Price ID not found in Stripe" error, you need to get the **actual Price IDs** from your Stripe account.

## Step-by-Step: Finding Price IDs

### 1. Go to Your Products in Stripe

1. **Log into Stripe Dashboard**: https://dashboard.stripe.com
2. **Make sure you're in Test Mode** (sandbox) - you should see "Sandbox" at the top
3. **Go to Products**: Click "Products" in the left sidebar
   - Or go directly to: https://dashboard.stripe.com/test/products

### 2. Find Each Product

You should see your products listed. For each one:

#### For Subscription Products (Starter, Growth, Pro):

1. **Click on the product name** (e.g., "FusionCaller Starter Plan")
2. You'll see the product details page
3. **Look for the "Pricing" section** - it shows the price and billing period
4. **Find the Price ID** - it looks like this:
   ```
   Price ID: price_1ABC123def456GHI789jkl012MNO345pqr678
   ```
5. **Click the copy icon** (📋) next to the Price ID to copy it
6. **This is what you need** - it starts with `price_`

#### For Setup Fee Products:

1. **Click on the setup fee product** (e.g., "FusionCaller Starter Setup Fee")
2. **Look for the Price ID** in the pricing section
3. **Copy it** - it also starts with `price_`

### 3. Important: Price ID vs Product ID

⚠️ **Make sure you're copying the PRICE ID, not the Product ID!**

- ✅ **Price ID**: Starts with `price_` - **This is what you need!**
- ❌ **Product ID**: Starts with `prod_` - This is NOT what you need

### 4. Update Vercel Environment Variables

1. **Go to Vercel**: https://vercel.com
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **For each Price ID variable, update it**:

   - `STRIPE_STARTER_PRICE_ID` = Price ID from "FusionCaller Starter Plan"
   - `STRIPE_GROWTH_PRICE_ID` = Price ID from "FusionCaller Growth Plan"
   - `STRIPE_PRO_PRICE_ID` = Price ID from "FusionCaller Pro Plan"
   - `STRIPE_SETUP_FEE_STARTER_PRICE_ID` = Price ID from "FusionCaller Starter Setup Fee"
   - `STRIPE_SETUP_FEE_GROWTH_PRICE_ID` = Price ID from "FusionCaller Growth Setup Fee"
   - `STRIPE_SETUP_FEE_PRO_PRICE_ID` = Price ID from "FusionCaller Pro Setup Fee"

5. **Click "Save"** for each one
6. **Redeploy your application**

## Quick Checklist

- [ ] I'm in Test Mode (Sandbox) in Stripe
- [ ] I found all 6 products (3 subscriptions + 3 setup fees)
- [ ] I copied the **Price ID** (starts with `price_`) not Product ID
- [ ] I updated all 6 environment variables in Vercel
- [ ] I redeployed my application

## Example of What You Should See

When you click on a product, you should see something like:

```
FusionCaller Starter Plan
─────────────────────────
Pricing
$149.00 USD / month

Price ID: price_1QwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZ
[📋 Copy]
```

**Copy that Price ID** (the `price_1QwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZ` part)

## Still Having Issues?

If you can't find the products:
1. Make sure you created them in **Test Mode** (not Live Mode)
2. Check that you're looking in the right Stripe account
3. If products don't exist, go back to Step 2 in the setup guide and create them

If the Price IDs still don't work:
1. Double-check you copied the entire Price ID (they're long!)
2. Make sure there are no extra spaces before/after
3. Verify the Price ID exists in Stripe by searching for it in the Products page

