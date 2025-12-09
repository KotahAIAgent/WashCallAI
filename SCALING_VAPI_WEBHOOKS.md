# Scaling to 100+ Assistants: Webhook Architecture

## How It Works

**You only need ONE webhook URL for ALL assistants!**

```
All Vapi Assistants → Single Webhook URL → Routes to Correct Organization
```

### The Flow:

1. **Customer calls** → Vapi Assistant answers
2. **Vapi sends webhook** → Your single endpoint: `https://yourdomain.com/api/vapi/webhook`
3. **Webhook identifies organization** by:
   - **Outbound calls**: `metadata.organizationId` (we pass this when making calls)
   - **Inbound calls**: Phone number lookup (matches phone number to organization)
4. **Call is saved** to the correct organization in your database

## Setup Options

### Option 1: Set at Vapi Account Level (Best for Scale)

If Vapi supports account-level webhook configuration:
1. Set webhook URL once in Vapi Dashboard → Settings → Account Settings
2. ALL assistants automatically use this webhook
3. No per-assistant configuration needed

### Option 2: Set Programmatically When Creating Assistants

When you create a new assistant via API, include the webhook URL:

```javascript
// When creating a new assistant
const response = await fetch('https://api.vapi.ai/assistant', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${VAPI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Customer Assistant',
    // ... other config ...
    serverUrl: 'https://yourdomain.com/api/vapi/webhook', // ← Set webhook here
  })
})
```

### Option 3: Bulk Update Existing Assistants

If you already have assistants, update them all at once:

```bash
# Get all assistant IDs, then update each one
for assistant_id in $(list_of_assistant_ids); do
  curl -X PATCH https://api.vapi.ai/assistant/$assistant_id \
    -H "Authorization: Bearer $VAPI_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"serverUrl": "https://yourdomain.com/api/vapi/webhook"}'
done
```

## How the Webhook Routes Calls

The webhook automatically identifies which organization each call belongs to:

### For Outbound Calls (You initiate):
```javascript
// When making a call, we pass organizationId in metadata
metadata: {
  organizationId: "org-123",
  leadId: "lead-456"
}
// Webhook reads: payload.metadata.organizationId → Routes to correct org
```

### For Inbound Calls (Customer calls you):
```javascript
// Webhook receives phone number that was called
// Looks up in phone_numbers table:
phone_numbers.provider_phone_id = payload.phoneNumberId
// Finds: phone_numbers.organization_id → Routes to correct org
```

## Implementation: Auto-Set Webhook on Assistant Creation

We should create a helper function that automatically sets the webhook URL when you create assistants. This ensures every new assistant is configured correctly.

## Key Points

✅ **One webhook URL** handles all assistants  
✅ **Automatic routing** to correct organization  
✅ **No manual configuration** needed per assistant (if done programmatically)  
✅ **Scales infinitely** - 1 assistant or 10,000 assistants, same webhook  

## Next Steps

1. Check if Vapi supports account-level webhook configuration
2. If not, create a function to auto-set webhook URL when creating assistants
3. Bulk update existing assistants to use the webhook URL

