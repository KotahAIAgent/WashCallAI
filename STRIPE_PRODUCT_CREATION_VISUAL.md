# Visual Guide: Creating Stripe Products

This is a detailed visual guide showing exactly where to click and what to enter when creating products in Stripe.

## Step 1: Navigate to Products

1. Log into Stripe: https://dashboard.stripe.com
2. Look at the **left sidebar** - you'll see:
   ```
   🏠 Home
   💳 Payments
   📦 Products  ← Click here
   👥 Customers
   📊 Analytics
   ...
   ```
3. Click **"Products"**

## Step 2: Add Your First Product

You'll see a page that says "Products" at the top with a button that says:
```
[+ Add product]  ← Click this button
```

## Step 3: Fill Out the Product Form

After clicking "Add product", you'll see a form. Here's what each section looks like:

### Section 1: Product Information

```
┌─────────────────────────────────────────┐
│ Product information                     │
├─────────────────────────────────────────┤
│                                         │
│ Name *                                  │
│ ┌───────────────────────────────────┐  │
│ │ FusionCaller Starter Plan         │  │ ← Type this
│ └───────────────────────────────────┘  │
│                                         │
│ Description (optional)                 │
│ ┌───────────────────────────────────┐  │
│ │ Unlimited inbound AI calls        │  │ ← Optional
│ └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Section 2: Pricing

This is the **most important part** - make sure you select the right option!

```
┌─────────────────────────────────────────┐
│ Pricing                                  │
├─────────────────────────────────────────┤
│                                         │
│ Pricing model *                         │
│ ○ Recurring  ← SELECT THIS for subscriptions │
│ ○ One time                              │
│                                         │
│ Price *                                 │
│ ┌───────────────────────────────────┐  │
│ │ 149.00                            │  │ ← Enter amount
│ └───────────────────────────────────┘  │
│                                         │
│ Currency *                              │
│ ┌───────────────────────────────────┐  │
│ │ USD (United States Dollar) ▼      │  │ ← Select USD
│ └───────────────────────────────────┘  │
│                                         │
│ Billing period *                        │
│ ┌───────────────────────────────────┐  │
│ │ Monthly ▼                         │  │ ← Select Monthly
│ └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**For Setup Fees**, the pricing section looks different:

```
┌─────────────────────────────────────────┐
│ Pricing                                  │
├─────────────────────────────────────────┤
│                                         │
│ Pricing model *                         │
│ ○ Recurring                             │
│ ○ One time  ← SELECT THIS for setup fees │
│                                         │
│ Price *                                 │
│ ┌───────────────────────────────────┐  │
│ │ 99.00                             │  │ ← Enter amount
│ └───────────────────────────────────┘  │
│                                         │
│ Currency *                              │
│ ┌───────────────────────────────────┐  │
│ │ USD (United States Dollar) ▼      │  │ ← Select USD
│ └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Section 3: Save Button

At the bottom of the form, you'll see:

```
┌─────────────────────────────────────────┐
│                                         │
│              [Cancel]  [Save product]    │ ← Click "Save product"
│                                         │
└─────────────────────────────────────────┘
```

## Step 4: Find Your Price ID

After clicking "Save product", you'll be taken to the product page. Look for a section that shows:

```
┌─────────────────────────────────────────┐
│ FusionCaller Starter Plan               │
├─────────────────────────────────────────┤
│                                         │
│ Pricing                                 │
│ ┌───────────────────────────────────┐  │
│ │ $149.00 USD / month               │  │
│ │                                    │  │
│ │ Price ID: price_1ABC123xyz...     │  │ ← This is what you need!
│ │ [📋 Copy]                          │  │ ← Click to copy
│ └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**The Price ID looks like**: `price_1ABC123def456GHI789jkl012MNO345pqr678`

## Quick Reference: What to Enter

### Subscription Products (Recurring)

| Field | Starter | Growth | Pro |
|-------|---------|--------|-----|
| Name | FusionCaller Starter Plan | FusionCaller Growth Plan | FusionCaller Pro Plan |
| Pricing Model | **Recurring** | **Recurring** | **Recurring** |
| Price | 149.00 | 349.00 | 699.00 |
| Currency | USD | USD | USD |
| Billing Period | Monthly | Monthly | Monthly |

### Setup Fee Products (One-time)

| Field | Starter | Growth | Pro |
|-------|---------|--------|-----|
| Name | FusionCaller Starter Setup Fee | FusionCaller Growth Setup Fee | FusionCaller Pro Setup Fee |
| Pricing Model | **One time** | **One time** | **One time** |
| Price | 99.00 | 149.00 | 199.00 |
| Currency | USD | USD | USD |

## Common Mistakes to Avoid

❌ **Don't select "One time" for subscriptions** - they won't renew!
❌ **Don't select "Recurring" for setup fees** - customers will be charged monthly!
❌ **Don't use the Product ID** - you need the **Price ID** (starts with `price_`)
✅ **Do copy the Price ID immediately** - it's easier than finding it later
✅ **Do double-check the pricing model** before saving

## Need to Edit Later?

If you need to change something:
1. Go to Products page
2. Click on the product name
3. Click "Edit" or the pencil icon
4. Make your changes
5. Save

**Note**: You can't change a product from "Recurring" to "One time" or vice versa after creation. You'll need to create a new product.

