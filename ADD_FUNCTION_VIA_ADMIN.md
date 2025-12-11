# Add Function via Admin Panel (Easier Method!)

Since the Vapi dashboard button isn't working, let's use the **automatic method** instead:

## Step 1: Go to Admin Panel

1. Go to your website: `www.fusioncaller.com/app/admin`
2. (Or your Vercel URL: `wash-call-ai.vercel.app/app/admin`)

## Step 2: Find "Configure Agent" Section

Look for the section that says **"Configure Agent"** or **"Set Agent ID"**

## Step 3: Re-Save the Agent ID

1. **Select Organization:** Choose "DSH Pressure Washing" (or whatever the org name is)
2. **Select Agent Type:** Choose "Inbound"
3. **Enter Agent ID:** Enter: `2d4b6384-4fb2-4f2e-a2bd-c7a6ec3bc0bb`
   *(This is the same ID that's already there - you're just re-saving it)*
4. **Click Submit**

## What Happens

When you submit, the system will:
1. ✅ Save the agent ID (as normal)
2. ✅ **Automatically call Vapi API to add the `check_access` function**
3. ✅ Configure the webhook URL

This happens **automatically via API** - no need to click buttons in Vapi dashboard!

## Step 4: Verify It Worked

After submitting:
1. Go back to Vapi Dashboard → Your Assistant → Tools tab
2. Refresh the page
3. Check if `check_access` function now appears in Custom Functions

---

## Why This Works

The code in `src/lib/agents/actions.ts` automatically calls `autoConfigureWebhook()` when you set an agent ID. This function:
- Gets the current assistant config
- Adds the `check_access` function if it doesn't exist
- Updates the assistant via Vapi API

**No manual clicking needed!** 🎉

