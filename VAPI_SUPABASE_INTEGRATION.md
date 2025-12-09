# Vapi Supabase Integration Setup

## Overview

Vapi can write call data directly to your Supabase database via their native Supabase integration. This is more reliable than webhooks and scales better.

## How It Works

```
Vapi Call → Vapi writes to vapi_call_events table → Database trigger processes it → Creates call/lead records
```

## Setup Steps

### 1. Run the Migration

The migration creates:
- `vapi_call_events` table - Where Vapi writes call data
- `process_vapi_call_event()` function - Processes events automatically
- Trigger - Automatically processes new events

Run this in Supabase SQL Editor:
```sql
-- See: supabase/migrations/add-vapi-integration-table.sql
```

### 2. Configure Vapi Supabase Integration

1. Go to Vapi Dashboard → Your Assistant → **Integrations** tab
2. Click **"Connect Supabase"** or **"Add Integration"**
3. Enter your Supabase credentials:
   - **Supabase URL**: `https://your-project.supabase.co`
   - **Supabase Service Role Key**: Your service role key (from Supabase Dashboard → Settings → API)
   - **Table Name**: `vapi_call_events`
4. Configure what data Vapi should write:
   - Call ID
   - Assistant ID
   - Phone Number ID
   - Direction (inbound/outbound)
   - Status
   - Phone numbers (from/to)
   - Duration
   - Recording URL
   - Transcript
   - Summary
   - Metadata (include organizationId, leadId if available)

### 3. Test the Integration

1. Make a test call
2. Check Supabase:
   ```sql
   SELECT * FROM vapi_call_events 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
3. Check if it was processed:
   ```sql
   SELECT * FROM calls 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

### 4. Verify Processing

The trigger automatically:
- ✅ Identifies the organization (by phone number or metadata)
- ✅ Creates call records in `calls` table
- ✅ Creates leads for inbound calls
- ✅ Links calls to leads
- ✅ Marks events as processed

## How Organization Identification Works

The trigger tries multiple methods to identify which organization a call belongs to:

1. **Metadata** (for outbound calls):
   ```json
   {
     "organizationId": "uuid-here",
     "leadId": "uuid-here"
   }
   ```

2. **Phone Number ID** (Vapi's phone number ID):
   - Looks up `phone_numbers.provider_phone_id`

3. **Actual Phone Number**:
   - Matches `phone_numbers.phone_number` with the called number

## For Outbound Calls

When making outbound calls, include metadata:

```javascript
// In your outbound call code
metadata: {
  organizationId: organizationId,
  leadId: leadId,
  direction: 'outbound'
}
```

This ensures the trigger can route the call correctly.

## Monitoring

### Check Unprocessed Events

```sql
SELECT * FROM vapi_call_events 
WHERE processed = false 
ORDER BY created_at DESC;
```

### Check Processing Errors

```sql
SELECT * FROM vapi_call_events 
WHERE error_message IS NOT NULL 
ORDER BY created_at DESC;
```

### View Recent Processed Events

```sql
SELECT 
  vce.*,
  c.id as call_id,
  c.organization_id
FROM vapi_call_events vce
LEFT JOIN calls c ON c.provider_call_id = vce.call_id
WHERE vce.processed = true
ORDER BY vce.created_at DESC
LIMIT 20;
```

## Troubleshooting

### Events Not Being Created

1. **Check Vapi Integration Settings**:
   - Verify Supabase URL is correct
   - Verify service role key is correct
   - Check table name is `vapi_call_events`

2. **Check Vapi Logs**:
   - Go to Vapi Dashboard → Logs
   - Look for Supabase integration errors

### Events Not Being Processed

1. **Check Trigger**:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'process_vapi_call_event_trigger';
   ```

2. **Check Function**:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'process_vapi_call_event';
   ```

3. **Check for Errors**:
   ```sql
   SELECT * FROM vapi_call_events 
   WHERE error_message IS NOT NULL;
   ```

### Organization Not Found

If you see `error_message = 'Could not identify organization for call'`:

1. **For Inbound Calls**:
   - Make sure phone number is in `phone_numbers` table
   - Verify `provider_phone_id` matches Vapi's phone number ID
   - Or verify `phone_number` matches the called number

2. **For Outbound Calls**:
   - Make sure you're passing `organizationId` in metadata
   - Check that the metadata is being written correctly

## Advantages Over Webhooks

✅ **More Reliable**: Direct database writes, no HTTP failures  
✅ **Faster**: No network latency  
✅ **Scalable**: Handles high call volumes better  
✅ **Automatic**: Trigger processes events immediately  
✅ **No Configuration Per Assistant**: One integration handles all assistants  

## Next Steps

1. Run the migration
2. Configure Vapi Supabase integration
3. Test with a call
4. Monitor the `vapi_call_events` table
5. Verify calls/leads are being created

