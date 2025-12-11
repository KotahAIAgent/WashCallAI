# Final Setup Checklist

## ✅ What You've Done:
1. ✅ Created the `check_access` tool in Vapi
2. ✅ Configured it to call `https://www.fusioncaller.com/api/vapi/check-access`
3. ✅ Added it to your assistant

## ⚠️ What You Still Need to Do:

### Step 1: Update System Prompt (CRITICAL!)

The assistant won't automatically call `check_access` - you need to tell it to in the system prompt.

1. Go to Vapi Dashboard → Your Assistant → **Model** tab
2. Find the **System Prompt** field
3. Copy the prompt from `VAPI_PROMPT_WITH_ACCESS_CHECK.txt`
4. Paste it into the System Prompt field (replace your current prompt)
5. **Save**

The key part is at the top:
```
CRITICAL ACCESS CHECK - MUST HAPPEN FIRST:
At the very start of EVERY call, before saying anything else, you MUST call the check_access function...
```

### Step 2: Test It

1. **Cancel a plan** for a test organization in your admin panel
2. **Call the phone number**
3. **Expected behavior:**
   - Assistant calls `check_access` function first
   - Function returns `{"allowed": false}`
   - Assistant says the message and ends the call
   - Call should end within 2-3 seconds

---

## If It Doesn't Work:

1. **Check Vapi logs** - See if `check_access` is being called
2. **Check your endpoint logs** - Go to Vercel → Logs → Filter for `/api/vapi/check-access`
3. **Verify system prompt** - Make sure it explicitly says to call `check_access` first

---

## Summary:

✅ Tool is configured  
⚠️ **System prompt needs to be updated** ← Do this now!  
✅ Then test with a cancelled plan

