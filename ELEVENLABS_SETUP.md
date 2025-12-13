# ElevenLabs Voice Library Integration

Your application now pulls voices directly from your ElevenLabs account instead of using a hardcoded list.

## Setup Instructions

### 1. Get Your ElevenLabs API Key

1. Go to [https://elevenlabs.io](https://elevenlabs.io)
2. Sign in to your account
3. Navigate to **Profile** → **API Keys** (or go directly to [https://elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys))
4. Click **"Create API Key"** or copy an existing key
5. Copy the API key (it starts with something like `sk_...`)

### 2. Add to Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **"Add New"**
4. Add:
   - **Key**: `ELEVENLABS_API_KEY`
   - **Value**: Your ElevenLabs API key
   - **Environment**: Select all environments (Production, Preview, Development)
5. Click **"Save"**
6. **Redeploy** your application for the changes to take effect

### 3. How It Works

- When users open the Voice Selection component, it automatically fetches all voices from your ElevenLabs library
- Users can select any voice from your account
- The voice ID is saved and automatically applied to their Vapi assistant
- Changes take effect immediately

### 4. Troubleshooting

**No voices showing up?**
- Make sure `ELEVENLABS_API_KEY` is set in Vercel
- Verify your API key is valid and has access to your voice library
- Check Vercel logs for any API errors

**API errors?**
- Ensure your ElevenLabs account has an active subscription (if required)
- Verify the API key hasn't been revoked
- Check that you have voices in your ElevenLabs library

**Voice not applying?**
- Check that the voice ID exists in your ElevenLabs account
- Verify the Vapi assistant update is successful (check logs)
- Ensure the voice format matches Vapi's requirements

## API Endpoint

The integration uses the following endpoint:
- **GET** `/api/elevenlabs/voices` - Fetches all voices from your ElevenLabs account

This endpoint is server-side only and requires the `ELEVENLABS_API_KEY` environment variable.

