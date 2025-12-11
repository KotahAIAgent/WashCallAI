# How to Set Up Tools in Vapi Dashboard

Since Custom Functions isn't working, let's use the **Tools** section instead.

## Step 1: Go to Tools Section

1. In Vapi Dashboard → Your Assistant → **Tools** tab
2. Look for the **"Tools"** section at the top (not "Custom Functions")
3. You should see a dropdown that says **"Select Tools"**

## Step 2: Create Tool via API Request

Since the dashboard might not work, we can create it via API. But first, let's try the dashboard:

### Option A: Use "API Request" Tool Type

1. In the Tools section, look for **"API Request"** in the tool types
2. Click to add an API Request tool
3. Configure:
   - **Name:** `check_access`
   - **URL:** `https://www.fusioncaller.com/api/vapi/check-access`
   - **Method:** `POST`
   - **Headers:** (usually auto-filled)

### Option B: Create Tool via Global Tools Library

1. Go to **Tools** in the left sidebar (global tools library)
2. Click **"Create Tool"** button
3. Select **"API Request"** or **"Custom Tool"**
4. Fill in:
   - **Name:** `check_access`
   - **Server URL:** `https://www.fusioncaller.com/api/vapi/check-access`
   - **Method:** `POST`
5. Save the tool
6. Go back to your Assistant → Tools tab
7. Use the **"Select Tools"** dropdown to add the tool you just created

---

## Alternative: Direct API Call

If the dashboard still doesn't work, I can create a script that directly calls Vapi's API to add the tool. Let me know if you want me to create that!

---

## What to Configure:

- **Tool Name:** `check_access`
- **Type:** API Request / Webhook
- **URL:** `https://www.fusioncaller.com/api/vapi/check-access`
- **Method:** `POST`
- **Description:** "Check if organization has active subscription"

Try Option B first (create in global Tools, then add to assistant) - that's usually the most reliable!

