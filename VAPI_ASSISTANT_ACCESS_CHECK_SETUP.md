# Vapi Assistant Access Check Configuration

## The Problem

Vapi webhooks are informational - they're called AFTER the call connects. We cannot prevent calls from connecting via webhook.

## The Solution

Configure each Vapi assistant to call an access check function/endpoint at the START of the call (before answering).

## How to Configure in Vapi Dashboard

### Option 1: Function Call (Recommended)

1. Go to Vapi Dashboard → Assistants
2. Select the assistant (inbound or outbound)
3. Go to "Functions" or "Tools" section
4. Add a new function:
   - **Name**: `check_access` or `verify_subscription`
   - **Type**: `webhook` or `server`
   - **URL**: `https://your-domain.com/api/vapi/check-access`
   - **Method**: `POST`
   - **Trigger**: Set to trigger at the START of the call (before first message)

5. Configure the assistant's system prompt or first message to:
   - Call this function immediately when call starts
   - If function returns `allowed: false`, play the message and end call

### Option 2: Server URL (If Supported)

1. Go to Vapi Dashboard → Assistants
2. Select the assistant
3. Find "Server URL" or "Function URL" setting
4. Set to: `https://your-domain.com/api/vapi/check-access`
5. Configure to call at call start

### Option 3: First Message Function

Configure the assistant's first message to:
1. Call the access check function
2. If access denied, say: "Your subscription has ended. Please renew to continue."
3. End the call

## Programmatic Configuration (For Scaling)

When creating/updating assistants, configure them with:

```json
{
  "functions": [
    {
      "name": "check_access",
      "type": "webhook",
      "url": "https://your-domain.com/api/vapi/check-access",
      "method": "POST"
    }
  ],
  "firstMessage": "Let me check your account status... [call check_access function]"
}
```

## Endpoint Details

**URL**: `/api/vapi/check-access`  
**Method**: `POST`  
**Expected Payload**:
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

## Current Status

- ✅ Endpoint created: `/api/vapi/check-access`
- ⚠️ Needs to be configured in each Vapi assistant
- ⚠️ Manual configuration required per assistant (or programmatic if Vapi API supports it)

## For Hundreds of Clients

You'll need to:
1. Configure this endpoint in each assistant's function list
2. Or use Vapi API to programmatically add this function to all assistants
3. Or create a template assistant with this function, then clone it for each client

