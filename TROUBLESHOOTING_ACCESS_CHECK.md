# Troubleshooting: Calls Still Going Through After Cancelling Plan

## What the Logs Mean

The logs showing `403` and `⚠️ SOLUTION: Need to configure Vapi assistant to check access BEFORE answering` mean:

✅ **The webhook is working correctly** - it's detecting cancelled plans  
❌ **But calls still connect** - because webhooks are informational only

## The Real Solution

The assistant itself must call the `check_access` function at the START of the call. Here's how to verify it's working:

---

## Step 1: Verify Function is Added to Assistant

1. Go to **Vapi Dashboard** → **Assistants** → Your Assistant
2. Look for **"Functions"** or **"Tools"** section
3. You should see a function named `check_access` with URL: `https://www.fusioncaller.com/api/vapi/check-access`

**If it's NOT there:**
- Go to your Admin Panel → Configure Agent
- Re-save the agent ID (this triggers automatic function addition)

---

## Step 2: Verify System Prompt is Updated

1. In Vapi Dashboard → Your Assistant → **System Prompt**
2. The FIRST thing in your prompt should be the access check instructions
3. It should say something like: "At the very start of EVERY call, before saying anything else, you MUST call the check_access function..."

**If it's NOT there:**
- Copy the prompt from `VAPI_PROMPT_WITH_ACCESS_CHECK.txt`
- Paste it into your assistant's system prompt

---

## Step 3: Test if Function is Being Called

### Option A: Check Vapi Dashboard Logs

1. Go to **Vapi Dashboard** → **Calls** or **Logs**
2. Find a recent call
3. Look for function calls - you should see `check_access` being called
4. Check the response - should show `{"allowed": true}` or `{"allowed": false}`

### Option B: Check Your Endpoint Logs

1. Go to **Vercel Dashboard** → **Logs**
2. Filter for `/api/vapi/check-access`
3. You should see POST requests when calls start
4. If you DON'T see any requests, the function isn't being called

---

## Step 4: Common Issues

### Issue 1: Function Not Being Called

**Symptoms:** No logs in `/api/vapi/check-access`, calls still go through

**Fix:**
- Make sure the system prompt explicitly says "call check_access function"
- The prompt should be very clear: "MUST call check_access BEFORE greeting"
- Some AI models need explicit instructions - try: "Step 1: Call check_access function. Step 2: Check response. Step 3: If allowed=false, end call."

### Issue 2: Function Returns Allowed But Shouldn't

**Symptoms:** Function is called, but returns `{"allowed": true}` for cancelled plans

**Fix:**
- Check the database - make sure `plan` field is `null` and `trial_ends_at` is in the past
- Check admin panel - verify the plan was actually removed

### Issue 3: Function Called But Call Continues

**Symptoms:** Function is called, returns `{"allowed": false}`, but call still continues

**Fix:**
- The system prompt must explicitly say "end the call" or "hang up" if `allowed: false`
- Try adding: "If check_access returns allowed: false, you MUST immediately end the call. Do NOT continue the conversation."

---

## Quick Test

1. **Cancel a plan** for a test organization
2. **Call the phone number**
3. **Expected behavior:**
   - Assistant calls `check_access` function (check logs)
   - Function returns `{"allowed": false, "message": "..."}`
   - Assistant says the message and ends call
   - Call should end within 2-3 seconds

4. **If call continues:**
   - Function might not be called → Check system prompt
   - Function might not be added → Re-save agent ID in admin panel
   - Assistant might not be ending call → Update system prompt to be more explicit

---

## Debug Checklist

- [ ] Function `check_access` exists in assistant (Vapi Dashboard)
- [ ] System prompt includes access check instructions at the top
- [ ] System prompt explicitly says to "end call" if `allowed: false`
- [ ] Test call shows function being called (check Vapi logs)
- [ ] Test call shows function returning `allowed: false` (check endpoint logs)
- [ ] Plan is actually cancelled in database (check admin panel)

---

## Still Not Working?

If you've verified all the above and calls still go through:

1. **Check Vapi's function call format** - Some assistants need the function called differently
2. **Try a simpler prompt** - Sometimes AI models need very explicit step-by-step instructions
3. **Check Vapi documentation** - Make sure function calling is enabled for your assistant model

The key is: **The assistant must call the function BEFORE greeting the caller.**

