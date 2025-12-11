# Vapi Assistant Access Check Configuration

## The Problem

Vapi webhooks are informational - they're called AFTER the call connects. We cannot prevent calls from connecting via webhook. The website is just a frontend; Vapi controls the actual call flow.

## The Solution

Configure each Vapi assistant to call an access check function at the START of the call (before answering). The assistant itself must call this function and handle the response.

## Automatic Configuration

✅ **The function is automatically added to assistants** when you call `adminSetAgent` or `autoConfigureWebhook`. The function is named `check_access` and points to `/api/vapi/check-access`.

## Manual Configuration Required

Even though the function is added automatically, **you must configure the assistant's system prompt or first message** to actually CALL this function at the start of every call.

### Step 1: Configure Assistant System Prompt

In Vapi Dashboard → Assistants → [Your Assistant] → System Prompt, add:

```
IMPORTANT: At the very start of EVERY call, before saying anything else, you MUST call the check_access function to verify the organization has an active subscription. 

If check_access returns {"allowed": false}, you must:
1. Say the message provided in the response (e.g., "Your subscription has ended. Please renew to continue using FusionCaller.")
2. Immediately end the call
3. Do NOT proceed with any other conversation

If check_access returns {"allowed": true}, you may proceed normally with the call.
```

### Step 2: Configure First Message (Alternative)

Alternatively, set the assistant's First Message to:

```
Let me verify your account status... [call check_access function]

If the function returns allowed: false, say: "Your subscription has ended. Please renew to continue using FusionCaller." and end the call.

If allowed: true, proceed with: [your normal greeting]
```

## How It Works

1. **Call comes in** → Vapi routes to your assistant
2. **Assistant starts** → System prompt instructs it to call `check_access` function first
3. **Function called** → `/api/vapi/check-access` checks database for active plan/trial
4. **Response returned**:
   - `{"allowed": true}` → Assistant proceeds normally
   - `{"allowed": false, "message": "..."}` → Assistant says message and ends call

## Endpoint Details

**URL**: `/api/vapi/check-access`  
**Method**: `POST`  
**Expected Payload** (from Vapi):
```json
{
  "assistantId": "uuid",
  "phoneNumberId": "uuid",
  "to": "+1234567890"
}
```

**Response (Access Granted)**:
```json
{
  "allowed": true
}
```

**Response (Access Denied)**:
```json
{
  "allowed": false,
  "message": "Your subscription has ended. Please renew to continue using FusionCaller."
}
```

## For Hundreds of Clients

1. ✅ **Function is automatically added** when you set agent IDs via `adminSetAgent`
2. ⚠️ **System prompt must be configured** in each assistant (or use a template)
3. **Template Approach**: Create one assistant with the system prompt configured, then clone it for each client

## Testing

1. Cancel a plan for a test organization
2. Call the phone number
3. The assistant should call `check_access` function
4. Function should return `{"allowed": false}`
5. Assistant should say the message and end the call

## Troubleshooting

- **Function not being called**: Check that the system prompt instructs the assistant to call `check_access` at the start
- **Function not found**: Verify the function was added via `autoConfigureWebhook` (check Vapi dashboard)
- **Access denied but call continues**: The assistant's system prompt may not be properly configured to end the call on `allowed: false`

