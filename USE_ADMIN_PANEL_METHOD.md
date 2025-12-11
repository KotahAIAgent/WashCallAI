# Use Admin Panel - Automatic Function Addition

Since the Vapi dashboard Custom Functions button doesn't work, use this method instead:

## Step-by-Step Instructions

### Step 1: Go to Admin Panel

1. Open your website: `www.fusioncaller.com/app/admin`
   - Or: `wash-call-ai.vercel.app/app/admin`

### Step 2: Find "Configure Agent" Section

Look for a section called:
- "Configure Agent"
- "Set Agent ID" 
- "Admin Set Agent"
- Or similar

### Step 3: Fill in the Form

1. **Organization:** Select "DSH Pressure Washing" (or your org name)
2. **Agent Type:** Select "Inbound"
3. **Vapi Assistant ID:** Enter: `2d4b6384-4fb2-4f2e-a2bd-c7a6ec3bc0bb`
   *(This is the same ID - you're just re-saving it to trigger the API)*

### Step 4: Click Submit

When you click Submit, the system will:
1. ✅ Save the agent ID
2. ✅ **Automatically call Vapi API** to add the `check_access` function
3. ✅ Configure the webhook URL

**No manual clicking in Vapi needed!**

### Step 5: Verify It Worked

1. Go back to Vapi Dashboard → Your Assistant → Tools tab
2. **Refresh the page** (F5)
3. Check if `check_access` function now appears in Custom Functions

---

## How It Works

The code automatically:
- Calls `autoConfigureWebhook()` when you save an agent ID
- Gets current assistant config from Vapi API
- Adds `check_access` function if it doesn't exist
- Updates the assistant via Vapi API

**This bypasses the broken dashboard button entirely!**

---

## If Admin Panel Doesn't Work

If you can't find the admin panel or it doesn't work, let me know and I can:
- Create a direct API endpoint to add the function
- Or provide a script you can run

But try the admin panel first - it should work!

