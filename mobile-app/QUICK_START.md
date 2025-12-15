# Mobile App Quick Start

Get your mobile app running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd mobile-app
npm install
```

## Step 2: Set Environment Variables

Create `.env` file:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
- Copy from your main app's `.env.local` file
- Or get from Supabase Dashboard → Settings → API

## Step 3: Start the App

```bash
npm start
```

## Step 4: Run on Device

**Option A: Expo Go (Easiest)**
1. Install "Expo Go" app on your phone
2. Scan the QR code shown in terminal
3. App opens on your phone!

**Option B: iOS Simulator (Mac only)**
- Press `i` in the terminal
- Requires Xcode installed

**Option C: Android Emulator**
- Press `a` in the terminal
- Requires Android Studio installed

## Testing Real-time Features

1. **Login** with your web app credentials
2. **Make a test call** to your inbound number
3. **Watch it appear** in the "Live Calls" tab instantly!
4. **Get a notification** on your phone

## What's Next?

- ✅ Test the app works
- ✅ Customize branding (see `app.json`)
- ✅ Build for production (see `MOBILE_APP_SETUP.md`)
- ✅ Distribute to clients

## Troubleshooting

**"Can't connect to Supabase"**
- Check `.env` file exists and has correct values
- Verify Supabase project is active

**"Notifications not working"**
- Grant notification permissions when prompted
- Check device settings → Notifications → FusionCaller

**"Real-time not updating"**
- Verify Supabase Realtime is enabled (see main README)
- Check you're logged in with a valid account

## Need Help?

See full documentation:
- `README.md` - Full mobile app docs
- `MOBILE_APP_SETUP.md` - Production setup guide
- Main project `README.md` - Backend setup

