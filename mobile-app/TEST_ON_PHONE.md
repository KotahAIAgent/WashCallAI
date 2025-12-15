# Testing on Your Phone - Step by Step

## Step 1: Navigate to Mobile App Directory

Open your terminal and go to the mobile app folder:

```bash
cd "/Users/dakkotahester/Desktop/NEW AI Agent/mobile-app"
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages (first time only, takes 1-2 minutes).

## Step 3: Create Environment File

Create a `.env` file in the `mobile-app` directory with your Supabase credentials:

```bash
# Create the file
touch .env
```

Then open it and add (copy from your main app's .env.local):

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**To find these values:**
1. Check your main app's `.env.local` file in the root directory
2. Or go to Supabase Dashboard → Settings → API

## Step 4: Start the Development Server

```bash
npm start
```

You'll see a QR code in your terminal and a menu like this:

```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

## Step 5: Connect Your Phone

### For iPhone:
1. Open the **Camera app** (not Expo Go)
2. Point it at the **QR code** in your terminal
3. Tap the notification that appears
4. It will open in Expo Go automatically

### For Android:
1. Open the **Expo Go app**
2. Tap **"Scan QR code"**
3. Point it at the **QR code** in your terminal
4. The app will load

## Step 6: Make Sure You're on the Same Network

**Important:** Your phone and computer must be on the same WiFi network!

- ✅ Same WiFi = Works
- ❌ Different networks = Won't connect

If you're having connection issues:
1. Make sure both devices are on the same WiFi
2. Try disabling VPN if you have one
3. Check your firewall isn't blocking the connection

## Step 7: Test the App

1. **Login** with your web app credentials
2. You should see the dashboard with your data
3. Try the different tabs:
   - Live Calls
   - Call History
   - Leads
   - Dashboard

## Troubleshooting

### "Unable to connect to Metro"
- Make sure your phone and computer are on the same WiFi
- Try restarting: Press `r` in the terminal to reload

### "Can't find Expo Go"
- Make sure Expo Go is installed from App Store (iOS) or Play Store (Android)
- For iPhone, use Camera app first, then it opens Expo Go

### "Network request failed" or "Can't connect to Supabase"
- Check your `.env` file has the correct values
- Make sure there are no extra spaces or quotes
- Verify your Supabase project is active

### QR Code not working
- Make sure terminal window is large enough to show full QR code
- Try typing `?` in the terminal to see connection options
- You can also manually enter the URL shown in the terminal

### App loads but shows errors
- Check the terminal for error messages
- Make sure `.env` file is in the `mobile-app` directory (not root)
- Verify Supabase credentials are correct

## Quick Commands

While the app is running, you can press:
- `r` - Reload the app
- `m` - Toggle developer menu
- `j` - Open debugger
- `?` - Show help

## Next Steps

Once it's working:
1. ✅ Test real-time features (make a test call)
2. ✅ Test push notifications
3. ✅ Try all the features
4. ✅ Customize the app (see `app.json`)

Enjoy testing! 🎉

