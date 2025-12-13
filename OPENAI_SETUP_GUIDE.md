# OpenAI API Key Setup Guide

## Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-`)
5. **Important**: Save it immediately - you won't be able to see it again!

## Step 2: Add to Environment Variables

### For Local Development (.env.local)

1. Create or open `.env.local` in your project root (same folder as `package.json`)
2. Add this line:
   ```bash
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
3. Replace `sk-your-actual-key-here` with your actual key from Step 1
4. Save the file

### For Production (Vercel/Deployment)

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-your-actual-key-here` (your actual key)
4. Select all environments (Production, Preview, Development)
5. Click "Save"

## Step 3: Restart Your Development Server

After adding the key, restart your Next.js server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 4: Verify It's Working

The system will automatically:
- ✅ Generate Hormozi-style messages when calls complete
- ✅ Send SMS to clients via Twilio
- ✅ Log success/errors in the console

Check your webhook logs after a call to see if SMS was sent successfully.

## Troubleshooting

### "OpenAI API key not configured" error
- Make sure the key is in `.env.local` (not just `.env`)
- Restart your dev server after adding the key
- Check for typos in the key name: `OPENAI_API_KEY` (all caps, underscores)

### SMS not sending
- Check Twilio credentials are set:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`
- Verify your Twilio account has SMS enabled
- Check phone number is valid and SMS-capable

### Messages have dashes
- The system automatically removes dashes
- If you see dashes, check OpenAI API is responding
- Review webhook logs for AI generation errors

## Cost Estimate

- **OpenAI**: ~$0.01-0.02 per SMS (very affordable)
- **Twilio SMS**: ~$0.0075 per SMS
- **Total**: ~$0.02 per client SMS

OpenAI uses GPT-4o-mini which is cost-effective for this use case.

