# Vapi Outbound Calling Setup Guide

This guide shows you how to set up Vapi to make outbound calls when you click "Make Call".

## ✅ **Prerequisites**

1. **Vapi Account** with API key
2. **Vapi Phone Number** (purchased in Vapi dashboard)
3. **Outbound Assistant** created in Vapi
4. **VAPI_API_KEY** set in Vercel environment variables

## 📋 **Step-by-Step Setup**

### **Step 1: Get Your Vapi Phone Number ID**

1. Go to [Vapi Dashboard](https://dashboard.vapi.ai)
2. Navigate to **Phone Numbers** (left sidebar)
3. Find your phone number (or purchase one if needed)
4. Click on the phone number
5. Copy the **Phone Number ID** (looks like `phone_xxxxx` or `pn_xxxxx`)

**Important:** This is NOT the phone number itself (e.g., `+14155551234`), but Vapi's internal ID for that number.

### **Step 2: Add Phone Number to Your System**

1. Go to your **Admin Panel** (`/app/admin`)
2. Find the organization you want to set up
3. Use the **"Add Phone Number"** card
4. Fill in:
   - **Organization:** Select the organization
   - **Phone Number:** The actual phone number in E.164 format (e.g., `+14155551234`)
   - **Vapi Phone Number ID:** The ID you copied in Step 1 (e.g., `phone_xxxxx`)
   - **Friendly Name:** Optional (e.g., "Main Line", "Outbound #1")
   - **Type:** Select `outbound` or `both`
   - **Daily Limit:** Maximum calls per day (e.g., `100`)
5. Click **"Add Phone Number"**

### **Step 3: Set Outbound Agent ID**

1. In the **Admin Panel**, find the organization
2. Use the **"Set Agent ID"** card
3. Select:
   - **Organization:** The organization
   - **Agent Type:** `Outbound`
   - **Agent ID:** Your Vapi outbound assistant ID (from Vapi dashboard → Assistants)
4. Click **"Set Agent ID"**

**Note:** This automatically:
- ✅ Sets the `outbound_agent_id` in your database
- ✅ Enables outbound calling (`outbound_enabled: true`)
- ✅ Configures the webhook URL automatically

### **Step 4: Assign Phone Number to Campaign (Optional)**

If you're making calls from a campaign:

1. Go to **Campaigns** → Select your campaign
2. Click **Settings**
3. Select the **Phone Number** you added in Step 2
4. Save

**OR** the system will automatically use the first available outbound phone number if none is assigned.

## 🧪 **Testing the Setup**

### **Test 1: Check Configuration**

1. Go to **Outbound AI** page (`/app/outbound`)
2. Verify:
   - ✅ **Status:** Shows "Active" (green badge)
   - ✅ **Agent ID:** Shows your Vapi assistant ID
   - ✅ **Phone Number:** Shows your phone number

### **Test 2: Make a Manual Call**

1. Go to **Campaigns** → Select a campaign
2. Find a contact with status "pending", "no_answer", or "voicemail"
3. Click the **three dots (⋮)** next to the contact
4. Click **"Make Call"**
5. The call should initiate immediately

### **Test 3: Check Vercel Logs**

If the call doesn't work, check Vercel logs:

1. Go to **Vercel Dashboard** → Your project → **Functions**
2. Look for errors in the logs
3. Common issues:
   - ❌ `Vapi API key not configured` → Add `VAPI_API_KEY` to Vercel
   - ❌ `Phone number not found` → Check `provider_phone_id` is correct
   - ❌ `Outbound agent not set up` → Set the outbound agent ID
   - ❌ `Daily call limit reached` → Wait or increase limit

## 🔍 **Troubleshooting**

### **Issue: "Vapi API key not configured"**

**Solution:**
1. Go to **Vercel Dashboard** → Your project → **Settings** → **Environment Variables**
2. Add `VAPI_API_KEY` with your Vapi API key
3. Redeploy your application

### **Issue: "Phone number not found"**

**Solution:**
1. Verify the `provider_phone_id` in your database matches Vapi's phone number ID
2. Check in Vapi dashboard that the phone number is active
3. Re-add the phone number with the correct ID

### **Issue: "Outbound agent not set up yet"**

**Solution:**
1. Go to Admin Panel
2. Set the Outbound Agent ID for the organization
3. Verify it's enabled (should auto-enable when set)

### **Issue: "Daily call limit reached"**

**Solution:**
1. Wait until the next day (limits reset at midnight)
2. OR increase the daily limit in the phone number settings
3. OR use a different phone number

### **Issue: Call initiates but doesn't connect**

**Check:**
1. Vapi dashboard → **Calls** → See if the call appears
2. Check the call status (queued, ringing, answered, failed)
3. Verify the customer phone number is valid (E.164 format)
4. Check Vapi logs for errors

## 📝 **What Happens When You Click "Make Call"**

1. ✅ **Authentication Check:** Verifies you're logged in
2. ✅ **Agent Config Check:** Verifies outbound agent is set up and enabled
3. ✅ **Phone Number Check:** Finds an available phone number
4. ✅ **Daily Limit Check:** Verifies phone number hasn't hit daily limit
5. ✅ **Contact Check:** Verifies contact hasn't been called 2+ times today
6. ✅ **Schedule Check:** Bypassed for manual calls (you can call anytime)
7. ✅ **Vapi API Call:** Makes POST request to `https://api.vapi.ai/call/phone`
8. ✅ **Call Logged:** Creates record in `calls` table
9. ✅ **Counters Updated:** Updates phone number and contact call counts

## 🎯 **Quick Checklist**

Before making your first call, verify:

- [ ] Vapi account created
- [ ] Vapi phone number purchased
- [ ] Phone number ID copied from Vapi dashboard
- [ ] Phone number added to system via Admin Panel
- [ ] Outbound assistant created in Vapi
- [ ] Outbound agent ID set in Admin Panel
- [ ] `VAPI_API_KEY` set in Vercel environment variables
- [ ] Campaign created (if using campaigns)
- [ ] Contact added with valid phone number
- [ ] Test call made successfully

## 🚀 **Next Steps**

Once setup is complete:
- ✅ Manual calls work immediately
- ✅ Campaign calls work via cron job (daily at 9 AM UTC)
- ✅ All calls are tracked in the Calls page
- ✅ Webhooks automatically update call status
- ✅ Leads are created from successful calls

## 📞 **Vapi API Call Format**

The system makes this API call to Vapi:

```json
POST https://api.vapi.ai/call/phone
Headers:
  Authorization: Bearer YOUR_VAPI_API_KEY
  Content-Type: application/json
Body:
{
  "assistantId": "your-outbound-assistant-id",
  "phoneNumberId": "phone_xxxxx",
  "customer": {
    "number": "+14155551234",
    "name": "John Doe"
  },
  "variables": {
    "businessName": "Your Business",
    "serviceArea": "City, State"
  },
  "metadata": {
    "organizationId": "org-uuid",
    "campaignContactId": "contact-uuid",
    "phoneNumberId": "phone-uuid"
  }
}
```

This is all handled automatically by the `initiateOutboundCall` function!

