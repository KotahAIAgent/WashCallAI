# How to Verify the `check_access` Function is Added

## Quick Answer

**The function is automatically added when you set an agent ID in the admin panel.** But here's how to verify it's there and what to do if it's not.

---

## Step 1: Check if Function is Already There

1. Go to **Vapi Dashboard** → **Assistants**
2. Click on your assistant (the one you use for DSH Pressure Washing)
3. Look for a section called **"Functions"** or **"Tools"** or **"Function Calls"**
4. Check if you see a function named:
   - `check_access` OR
   - `verify_subscription` OR
   - Any function with a URL containing `/check-access`

**If you see it → You're good!** Just update your system prompt (which you already did).

**If you DON'T see it → Continue to Step 2**

---

## Step 2: Add the Function (If Missing)

### Option A: Automatic (Easiest)

1. Go to your **Admin Panel** (`/app/admin`)
2. Find the **"Configure Agent"** section
3. Select the organization (DSH Pressure Washing)
4. Select the agent type (Inbound or Outbound)
5. Enter the **same agent ID** that's already there
6. Click **Submit**

This will trigger the automatic function addition. The function will be added to your assistant.

### Option B: Manual (If Option A doesn't work)

1. Go to **Vapi Dashboard** → **Assistants** → Your Assistant
2. Find **"Functions"** or **"Tools"** section
3. Click **"Add Function"** or **"Add Tool"**
4. Fill in:
   - **Name**: `check_access`
   - **Type**: `webhook` or `function`
   - **URL**: `https://www.fusioncaller.com/api/vapi/check-access` (or your domain)
   - **Method**: `POST`
   - **Description**: `Check if organization has active subscription`

---

## Step 3: Verify It Works

1. Make sure your system prompt includes the access check instructions (you already updated this)
2. Cancel a test plan for an organization
3. Call the phone number
4. The assistant should call `check_access` and end the call if access is denied

---

## Common Questions

**Q: Do I need to do this for every assistant?**  
A: Yes, each assistant (inbound and outbound) needs the function. But if you set the agent ID via admin panel, it happens automatically.

**Q: What if I already set the agent ID before this feature was added?**  
A: Just re-save the agent ID in the admin panel (Option A above) - it will add the function automatically.

**Q: How do I know if it's working?**  
A: After updating the prompt, test by cancelling a plan and calling. The assistant should check access before greeting.

---

## Summary

✅ **Function is added automatically** when you set agent IDs via admin panel  
✅ **System prompt must be updated** (you already did this)  
✅ **If function is missing**, re-save the agent ID in admin panel or add it manually

The most important part (updating the system prompt) is already done!

