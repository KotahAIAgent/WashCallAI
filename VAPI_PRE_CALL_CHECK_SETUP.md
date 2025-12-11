# Vapi Pre-Call-Check Setup

## Important: Configure Vapi to Call Pre-Call-Check

The `/api/vapi/pre-call-check` endpoint must be configured in your Vapi dashboard to block calls BEFORE they connect. Without this, calls will go through even if the plan is cancelled.

## How to Configure

1. Go to your Vapi Dashboard
2. Navigate to your Phone Number settings
3. Find the "Pre-Call Check" or "Before Call" webhook setting
4. Set it to: `https://yourdomain.com/api/vapi/pre-call-check`
5. Make sure it's enabled

## What It Does

- Called by Vapi BEFORE connecting an inbound call
- Checks if organization has active plan or trial
- Returns 403 to reject the call if no access
- Returns 200 to allow the call if access is granted

## Current Status

If calls are still going through after cancelling a plan:
1. Check Vapi dashboard - is pre-call-check configured?
2. Check logs - are you seeing `[Pre-Call Check]` logs?
3. If no logs, Vapi isn't calling the endpoint

## Alternative: Block at Webhook Level

The webhook (`/api/vapi/webhook`) is called AFTER the call connects, so it can't block it. However, we can:
- Log the call as blocked
- Not process the call data
- Return an error (though call already connected)

The webhook will log detailed information about why access was granted/denied.

