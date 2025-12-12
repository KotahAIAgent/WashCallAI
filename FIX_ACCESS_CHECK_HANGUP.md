# Fix: Calls Not Hanging Up When No Subscription

## Problem
Calls are still connecting even when organizations don't have active subscriptions. The webhook tries to hang up calls AFTER they're answered, which doesn't work.

## Root Cause
1. **Webhook is too late**: The webhook runs AFTER the call connects, so it can't prevent the call
2. **Pre-call-check not configured**: The `/api/vapi/pre-call-check` endpoint exists but may not be configured in Vapi
3. **Function not being called**: The `check_access` function may not be called at the start of calls

## Solution: Configure Pre-Call-Check in Vapi

### Option 1: Configure Pre-Call-Check at Phone Number Level (RECOMMENDED)

1. Go to Vapi Dashboard → Phone Numbers
2. Select your phone number
3. Find "Pre-Call Check" or "Before Call" setting
4. Set URL to: `https://www.fusioncaller.com/api/vapi/pre-call-check`
5. Save

**This will block calls BEFORE they connect if access is denied.**

### Option 2: Update Assistant System Prompt

If pre-call-check isn't available, update your assistant's system prompt to call the function immediately:

```
CRITICAL: At the very start of EVERY call, you MUST call the check_access function FIRST.

If check_access returns allowed: false, you MUST:
1. Immediately hang up the call
2. Do NOT speak to the caller
3. Do NOT answer any questions
4. End the call immediately

The check_access function will tell you if the organization has an active subscription or trial.
```

### Option 3: Configure Pre-Call-Check at Assistant Level

1. Go to Vapi Dashboard → Assistants
2. Select your assistant
3. Find "Pre-Call Check" or "Server URL" setting
4. Set to: `https://www.fusioncaller.com/api/vapi/pre-call-check`
5. Save

## Verify It's Working

1. **Check logs**: Look for `[Pre-Call Check]` logs in Vercel
2. **Test call**: Make a call from an org without subscription
3. **Should see**: Call rejected before connecting (no answer)

## Current Status

- ✅ Pre-call-check endpoint exists: `/api/vapi/pre-call-check`
- ✅ Check-access function exists: `/api/vapi/check-access`
- ❌ Pre-call-check may not be configured in Vapi dashboard
- ❌ Assistant may not be calling check_access function at start

## Next Steps

1. **Configure pre-call-check in Vapi** (Option 1 above)
2. **Update assistant system prompt** to call check_access first (Option 2)
3. **Test with an org that has no subscription** - call should be rejected immediately

