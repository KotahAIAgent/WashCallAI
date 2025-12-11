# Manual Setup: Add check_access Function in Vapi Dashboard

## You're in the Right Place!

You're looking at the **Custom Functions** section for your "Inbound - DSH Pressure Washing" assistant. Here's how to add the `check_access` function:

---

## Step-by-Step Instructions

### Step 1: Click "Create a new function"

Click the **"Create a new function"** button at the bottom of the Custom Functions section.

### Step 2: Fill in the Function Details

When the form appears, fill in:

**Function Name:**
```
check_access
```

**Description:**
```
Check if the organization has an active subscription before proceeding with the call. This function must be called at the very start of every call.
```

**Function Type:**
Select **"Webhook"** or **"Server URL"**

**URL:**
```
https://www.fusioncaller.com/api/vapi/check-access
```
*(Or use your Vercel URL if different: `https://wash-call-ai.vercel.app/api/vapi/check-access`)*

**Method:**
```
POST
```

**Parameters (if required):**
- The function will automatically receive `assistantId`, `phoneNumberId`, and `to` from Vapi
- You don't need to add parameters manually - Vapi will send them automatically

### Step 3: Save the Function

Click **"Save"** or **"Create"** to add the function.

### Step 4: Verify It's Added

After saving, you should see `check_access` listed in the Custom Functions section.

---

## Important Notes

1. **Function vs Tools:** Vapi distinguishes between "Tools" and "Functions" - you're in the right place (Custom Functions).

2. **Response Format:** The function should return:
   - `{"allowed": true}` for active subscriptions
   - `{"allowed": false, "message": "..."}` for cancelled/expired subscriptions

3. **System Prompt:** After adding the function, make sure your system prompt (in the "Model" tab) includes instructions to call this function at the start of calls.

---

## Next Steps

After adding the function:

1. ✅ Function is added (you just did this)
2. ⚠️ **Update System Prompt** - Go to the "Model" tab and add the access check instructions at the top
3. ✅ Test - Cancel a plan and call to verify it works

---

## Alternative: Automatic Addition

If you prefer automatic addition:

1. Go to your Admin Panel (`/app/admin`)
2. Find "Configure Agent" section
3. Select "Inbound - DSH Pressure Washing" organization
4. Select "Inbound" agent type
5. Enter the same agent ID: `2d4b6384-4fb2-4f2e-a2bd-c7a6ec3bc0bb`
6. Click Submit

This will trigger automatic function addition via the API.

