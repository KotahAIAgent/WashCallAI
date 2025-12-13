# Hormozi-Style SMS Follow-Up System

## Overview
This system automatically sends AI-generated, Hormozi-style SMS messages to clients after every call (inbound, outbound, voicemail, or failed). All messages follow Alex Hormozi's value-first messaging principles and contain NO dashes or hyphens.

## Features

### ✅ AI-Powered Message Generation
- Uses OpenAI GPT-4o-mini to generate personalized messages
- Follows Hormozi principles: value-first, urgency, risk reversal, specific outcomes
- No dashes/hyphens in any messages (enforced by AI prompt + post-processing)

### ✅ Phone Number Validation
- Validates phone numbers using Twilio Lookup API
- Checks if number is SMS-capable
- Normalizes to E.164 format

### ✅ Smart Message Strategies
Different message strategies based on call outcome:

1. **Inbound Interested**: Confirms conversation, recaps details, builds excitement
2. **Inbound Confirmation**: Thanks caller, confirms info, shows organization
3. **Outbound Interested**: Creates massive excitement, shows transformation value
4. **Outbound Callback**: Acknowledges request, builds anticipation
5. **Voicemail Follow-up**: Creates urgency and value to call back
6. **Unsuccessful Recovery**: Irresistible offer with value stacking and risk reversal

### ✅ Automatic Integration
- Automatically triggers after call completion
- Works for all call statuses: completed, answered, voicemail, failed
- Runs asynchronously (doesn't block webhook response)

## Files Created/Modified

### New Files
1. `src/lib/ai/sms-generator.ts` - AI message generation with Hormozi prompts
2. `src/lib/notifications/phone-validation.ts` - Phone number validation
3. `src/lib/notifications/client-sms.ts` - Client SMS service
4. `supabase/migrations/add-client-sms-enabled.sql` - Database migration

### Modified Files
1. `src/app/api/vapi/webhook/route.ts` - Added client SMS integration
2. `package.json` - Added OpenAI SDK dependency
3. `env.example` - Added OPENAI_API_KEY

## Setup Instructions

### 1. Install Dependencies
```bash
npm install openai
```

### 2. Environment Variables
Add to your `.env.local`:
```bash
OPENAI_API_KEY=sk-your-openai-api-key
```

### 3. Run Database Migration
Execute the migration in your Supabase SQL editor:
```sql
-- File: supabase/migrations/add-client-sms-enabled.sql
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS client_sms_enabled BOOLEAN DEFAULT true;
```

### 4. Configure Twilio (if not already done)
Ensure you have:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

## How It Works

1. **Call Completes**: Webhook receives call completion event
2. **Phone Validation**: Validates client phone number via Twilio Lookup
3. **AI Generation**: Generates Hormozi-style message based on call outcome
4. **Message Cleaning**: Removes any dashes/hyphens
5. **SMS Delivery**: Sends via Twilio to client

## Message Examples

### Inbound Interested
"Hi John, thank you for calling ABC Cleaning! We've noted your interest in pressure washing at 123 Main St. Our team will reach out within 24 hours to schedule your free estimate. We're excited to transform your property!"

### Outbound Interested
"Hi Sarah, great speaking with you! We're thrilled about pressure washing your commercial building. Our team delivers results that increase your property value. We'll call tomorrow to finalize details. Looking forward to working together!"

### Voicemail Follow-up
"Hi Mike, we tried reaching you about our pressure washing services. We're offering a limited time 20% discount for first time customers. Call us back at +1234567890 today to claim this offer. Don't miss out!"

### Unsuccessful Recovery
"Hi Jennifer, we understand you're busy. Here's what we can do: 100% satisfaction guarantee, no questions asked. If you're not thrilled with our work, we'll refund every penny. Plus, we'll beat any competitor's price by 10%. Ready to see the difference? Reply YES."

## Configuration

### Disable Client SMS (per organization)
Set `client_sms_enabled = false` in the organizations table to disable for specific organizations.

### Default Behavior
- Client SMS is **enabled by default** for all organizations
- Can be disabled per organization via database flag

## Cost Considerations

- **OpenAI API**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Twilio SMS**: ~$0.0075 per SMS (US numbers)
- **Twilio Lookup**: ~$0.005 per lookup

Estimated cost per SMS: ~$0.01-0.02 (very affordable)

## Troubleshooting

### SMS Not Sending
1. Check OpenAI API key is set
2. Verify Twilio credentials
3. Check phone number validation logs
4. Review organization `client_sms_enabled` flag

### Messages Have Dashes
- The system automatically removes dashes/hyphens
- If you see dashes, check OpenAI API is working
- Review logs for AI generation errors

### Phone Validation Failing
- Twilio Lookup may fail for some numbers
- System falls back to basic format validation
- Check Twilio account has Lookup API enabled

## Future Enhancements

- Custom message templates per organization
- A/B testing different message styles
- Analytics on SMS open/response rates
- Integration with CRM systems
- Multi-language support

