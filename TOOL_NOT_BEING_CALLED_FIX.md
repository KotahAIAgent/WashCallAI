# Fix: Tool Not Being Called

## The Problem

You have the prompt saying "check access" but the function isn't being called. This means:
- ❌ Tool might not be properly configured
- ❌ System prompt might not be explicit enough
- ❌ Tool might not be "callable" by the assistant

## Step 1: Verify Tool Configuration

1. Go to **Vapi Dashboard** → Your Assistant → **Tools** tab
2. Find `check_access` in the list
3. **Click on it** to edit
4. Verify:
   - **Name:** `check_access` (exactly this name)
   - **Type:** `apiRequest` or `webhook`
   - **URL:** `https://www.fusioncaller.com/api/vapi/check-access`
   - **Method:** `POST`
   - **Is it enabled/toggled ON?** (some tools have a toggle)

## Step 2: Make Prompt Even More Explicit

The prompt needs to use the EXACT function name. Try this:

```
CRITICAL FIRST STEP - DO THIS BEFORE ANYTHING ELSE:

When the call starts, you MUST call the function named "check_access" immediately. 
Do NOT greet the caller. Do NOT say hello. Call the "check_access" function first.

The function name is exactly: check_access

After calling check_access, read the response:
- If it says {"allowed": false}, say: "Your subscription has ended. Please renew to continue using FusionCaller." Then end the call.
- If it says {"allowed": true}, then proceed with your normal greeting.

This is MANDATORY. You must call check_access before any other action.
```

## Step 3: Check Tool Format

Vapi might need the tool in a specific format. Try:

1. Go to **Tools** (global) → Create new tool
2. Use this exact format:
   ```json
   {
     "name": "check_access",
     "type": "apiRequest",
     "url": "https://www.fusioncaller.com/api/vapi/check-access",
     "method": "POST"
   }
   ```
3. Save
4. Add it to your assistant

## Step 4: Alternative - Use First Message

Instead of system prompt, try setting the **First Message** to:

```
Let me check your account status... [call check_access function]

If check_access returns allowed: false, say: "Your subscription has ended. Please renew to continue using FusionCaller." and end the call.

If allowed: true, proceed with: "Thank you for calling DSH Pressure Washing, this is Riley with scheduling. How can I help you today?"
```

## Step 5: Check Vapi Model Settings

1. Go to **Model** tab
2. Check what model you're using
3. Some models don't support function calling well
4. Try switching to a different model if available

---

## Debugging Questions:

1. **Is the tool listed in the Tools tab?** (Yes/No)
2. **Can you click on it to edit it?** (Yes/No)
3. **What model are you using?** (Check Model tab)
4. **Is there a toggle/switch to enable the tool?** (Check Tools tab)

Let me know the answers and we can fix it!

