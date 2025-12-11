# Scalable Access Control for Hundreds of Clients

## Problem
- Vapi doesn't have a pre-call-check feature
- Can't manually configure each phone number for hundreds of clients
- Webhooks are called AFTER calls connect, so we can't prevent them

## Solution

### 1. Automatic Webhook Configuration
When a phone number is added via admin panel:
- Automatically configures Vapi webhook URL for that phone number
- No manual configuration needed
- Scales to hundreds of clients automatically

### 2. Access Check in Webhook
The webhook (`/api/vapi/webhook`) checks access immediately:
- Checks if organization has active plan or trial
- If no access, attempts to hang up call via Vapi API
- Logs call as blocked
- Returns 403 to reject processing

### 3. How It Works

**When Phone Number is Added:**
1. Admin adds phone number with Vapi Phone Number ID
2. System automatically configures webhook URL in Vapi
3. All calls to that number will hit our webhook

**When Call Comes In:**
1. Vapi calls our webhook with call data
2. We identify organization from phone number ID
3. We check access (plan, trial, admin privileges)
4. If no access:
   - Attempt to hang up call via Vapi API
   - Log call as blocked
   - Return 403
5. If access granted:
   - Process call normally

### 4. Configuration

**Environment Variables:**
- `VAPI_API_KEY` - Required for hanging up calls and auto-configuring webhooks
- `VAPI_WEBHOOK_URL` - Optional, defaults to `https://your-domain.com/api/vapi/webhook`
- `NEXT_PUBLIC_APP_URL` - Used if VAPI_WEBHOOK_URL not set

### 5. Limitations

- **Webhook is called after call connects**: We can't prevent the call from connecting, but we can hang it up immediately
- **Vapi API required**: Need VAPI_API_KEY to hang up calls programmatically
- **Phone number level webhooks**: May not be supported by Vapi (falls back to assistant-level)

### 6. Scaling

This solution scales automatically:
- Each phone number added = webhook auto-configured
- No manual steps per client
- Access checks happen in real-time
- Works for hundreds of clients

### 7. Testing

To test access control:
1. Remove plan for an organization
2. Call their phone number
3. Check logs - should see:
   - `[Webhook] ⛔⛔⛔ CALL BLOCKED`
   - `[Webhook] Attempting to hang up call`
   - Call logged as `failed` with reason

### 8. Future Improvements

- If Vapi adds pre-call-check support, we can use that
- Could add assistant-level webhook configuration as fallback
- Could add retry logic for hanging up calls

