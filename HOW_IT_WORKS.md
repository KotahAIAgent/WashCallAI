# How Vapi Integration Works

## Two Parts Working Together

### 1. Supabase Storage Integration (in Vapi Dashboard)
**Purpose:** Stores call recordings only

**What it does:**
- ✅ Saves audio recordings to Supabase Storage
- ❌ Does NOT track calls
- ❌ Does NOT create leads
- ❌ Does NOT count calls

**Where to configure:**
- Vapi Dashboard → Integrations → Supabase
- Fill in the storage bucket credentials

---

### 2. Edge Function Webhook (for tracking)
**Purpose:** Tracks all call data, creates leads, counts calls

**What it does:**
- ✅ Tracks every call (inbound & outbound)
- ✅ Creates leads automatically for inbound calls
- ✅ Updates call counts
- ✅ Links calls to leads
- ✅ Stores transcripts and summaries
- ✅ Tracks call status and duration

**Where to configure:**
- Deploy Edge Function in Supabase
- Set webhook URL in Vapi (via API or phone number settings)

---

## Complete Flow

```
Customer Calls → Vapi Answers
    ↓
Vapi does TWO things simultaneously:
    ↓
1. Recording → Supabase Storage (via Storage integration)
2. Call Data → Edge Function Webhook → Your Database
    ↓
Edge Function:
    - Creates call record in `calls` table
    - Creates lead in `leads` table (if inbound)
    - Links call to lead
    - Updates statistics
    ↓
Your Dashboard Shows:
    - Total Calls ✅
    - New Leads ✅
    - Call History ✅
    - Transcripts ✅
    - Recordings (from Storage) ✅
```

---

## What You Need to Set Up

### ✅ Supabase Storage Integration (Optional - for recordings)
- Configure in Vapi Dashboard → Integrations → Supabase
- Only needed if you want to store recordings

### ✅ Edge Function Webhook (Required - for tracking)
- Deploy in Supabase Dashboard → Edge Functions
- Set webhook URL in Vapi
- **This is what tracks calls and creates leads!**

---

## Without the Webhook

If you only set up Storage integration:
- ❌ No calls tracked
- ❌ No leads created
- ❌ No statistics
- ✅ Only recordings stored

**You MUST set up the Edge Function webhook to track calls!**

---

## Quick Setup Checklist

- [ ] Deploy Edge Function: `vapi-webhook` in Supabase
- [ ] Get webhook URL: `https://your-project.supabase.co/functions/v1/vapi-webhook`
- [ ] Set webhook URL in Vapi (via API: `serverUrl` field)
- [ ] (Optional) Configure Supabase Storage for recordings
- [ ] Test with a call
- [ ] Verify calls appear in database

---

## The Edge Function Does Everything

The Edge Function (`supabase/functions/vapi-webhook/index.ts`) automatically:

1. **Receives webhook** from Vapi when a call happens
2. **Identifies organization** (by phone number or metadata)
3. **Creates call record** in `calls` table
4. **Creates lead** (for inbound calls) in `leads` table
5. **Links call to lead**
6. **Updates statistics**

All of this happens automatically - you just need to deploy the function and set the webhook URL!

