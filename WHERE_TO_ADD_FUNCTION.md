# Where to Add the check_access Function

## You're in the Wrong Place!

You're currently on the **global Tools page** (`dashboard.vapi.ai/tools`). 

You need to add the function **directly to your assistant**, not in the global tools library.

---

## Correct Steps:

### Step 1: Go Back to Your Assistant

1. Click **"Assistants"** in the left sidebar (under BUILD)
2. Click on **"Inbound - DSH Pressure Washing"** from the list
3. You should see the assistant configuration page

### Step 2: Go to the Tools Tab

1. At the top of the assistant page, you'll see tabs: "Model", "Voice", "Transcriber", **"Tools"**, etc.
2. Click on the **"Tools"** tab
3. Scroll down to the **"Custom Functions"** section
4. Click **"Create a new function"**

### Step 3: Add the Function

Fill in:
- **Name:** `check_access`
- **Type:** Webhook
- **URL:** `https://www.fusioncaller.com/api/vapi/check-access`
- **Method:** `POST`

---

## Alternative: Use API Request Tool

If you can't find "Custom Functions", you can use the **"API Request"** tool type:

1. In the Tools tab, look for **"API Request"** option
2. Create a new API Request tool
3. Set it up to call your endpoint

---

## Quick Navigation:

**Current Location:** `dashboard.vapi.ai/tools` ❌ (Global tools - wrong place)

**Where You Need to Be:** 
- `dashboard.vapi.ai/assistants/[your-assistant-id]#custom-functions` ✅
- Or: Assistants → Inbound - DSH Pressure Washing → Tools tab → Custom Functions

---

## Visual Guide:

1. **Left Sidebar** → Click **"Assistants"** (under BUILD)
2. **Assistant List** → Click **"Inbound - DSH Pressure Washing"**
3. **Assistant Page** → Click **"Tools"** tab (at the top)
4. **Custom Functions Section** → Click **"Create a new function"**

That's where you add the function!

