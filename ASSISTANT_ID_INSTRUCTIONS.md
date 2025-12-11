# What to Do With Your Assistant ID

Your Vapi Inbound Assistant ID: `2d4b6384-4fb2-4f2e-a2bd-c7a6ec3bc0bb`

## Step 1: Verify Tool is Added

1. Go to **Vapi Dashboard** → **Assistants**
2. Click on your assistant (or search for ID: `2d4b6384-4fb2-4f2e-a2bd-c7a6ec3bc0bb`)
3. Go to **Tools** tab
4. Check if `check_access` tool is listed
5. If NOT listed:
   - Go to **Tools** in left sidebar (global tools)
   - Create the tool there
   - Then add it to this assistant

## Step 2: Update System Prompt

1. In the same assistant (`2d4b6384-4fb2-4f2e-a2bd-c7a6ec3bc0bb`)
2. Go to **Model** tab
3. Find **System Prompt** field
4. Copy the prompt from `ULTRA_EXPLICIT_SYSTEM_PROMPT.txt`
5. Paste it (replace current prompt)
6. **Save**

## Step 3: Test

1. Make a test call to NANO SEAL's number
2. Check Vercel logs for `/api/vapi/check-access`
3. Should see: `[Vapi Check Access] Received request:`

---

## Quick Checklist:

- [ ] Assistant ID: `2d4b6384-4fb2-4f2e-a2bd-c7a6ec3bc0bb`
- [ ] Tool `check_access` is added to this assistant
- [ ] System prompt updated with ultra-explicit instructions
- [ ] Test call made
- [ ] Check-access logs appear in Vercel

---

## Direct Link to Assistant:

`https://dashboard.vapi.ai/assistants/2d4b6384-4fb2-4f2e-a2bd-c7a6ec3bc0bb`

Use this to go directly to your assistant configuration!

