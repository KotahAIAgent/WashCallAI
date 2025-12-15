# FusionCaller Mobile App

A React Native mobile app built with Expo that allows clients to view live inbound calls and call information in real-time.

## Features

- 🔐 **Authentication** - Secure login with Supabase Auth
- 📞 **Live Call Monitoring** - Real-time notifications when inbound calls arrive
- 📱 **Push Notifications** - Get alerted instantly when calls come in
- 📊 **Dashboard** - View call statistics and metrics
- 📝 **Call Details** - See transcripts, summaries, and recordings
- 👥 **Leads Management** - View and filter all leads
- 📋 **Lead Details** - View lead information and call history
- 🔄 **Real-time Updates** - Calls update live as they progress

**Note**: The mobile app focuses on monitoring and viewing. For configuration, analytics, and settings, use the web app. See [FEATURE_COMPARISON.md](./FEATURE_COMPARISON.md) for details.

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Emulator
- Expo Go app on your phone (for testing)

### Installation

1. Navigate to the mobile app directory:
```bash
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm start
```

5. Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go app.

## Environment Variables

Copy the Supabase credentials from your main app's `.env.local`:

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

## Building for Production

### iOS

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Configure your app:
```bash
eas build:configure
```

3. Build for iOS:
```bash
eas build --platform ios
```

### Android

1. Build for Android:
```bash
eas build --platform android
```

## App Structure

```
mobile-app/
├── app/
│   ├── (auth)/
│   │   └── login.tsx          # Login screen
│   ├── (tabs)/
│   │   ├── index.tsx          # Live calls screen
│   │   ├── calls.tsx          # Call history
│   │   ├── dashboard.tsx      # Dashboard stats
│   │   └── _layout.tsx        # Tab navigation
│   ├── call-detail/
│   │   └── [id].tsx           # Call detail view
│   └── _layout.tsx            # Root layout
├── lib/
│   └── supabase.ts            # Supabase client
└── package.json
```

## Real-time Features

The app uses Supabase Realtime to subscribe to:
- New call insertions
- Call status updates
- Call transcript/summary updates

When a new inbound call arrives:
1. A push notification is sent
2. The call appears in the "Live Calls" tab
3. The call updates in real-time as it progresses

## Push Notifications

The app requests notification permissions on first launch. Notifications are sent when:
- A new inbound call arrives
- Call status changes to important states

## Testing

1. **Development**: Use Expo Go app on your phone
2. **iOS Simulator**: Requires Xcode (Mac only)
3. **Android Emulator**: Requires Android Studio

## Deployment

### App Store (iOS)

1. Build with EAS:
```bash
eas build --platform ios --profile production
```

2. Submit to App Store:
```bash
eas submit --platform ios
```

### Google Play (Android)

1. Build with EAS:
```bash
eas build --platform android --profile production
```

2. Submit to Google Play:
```bash
eas submit --platform android
```

## Troubleshooting

### Notifications not working
- Ensure notification permissions are granted
- Check that `expo-notifications` is properly configured
- Verify Supabase Realtime is enabled for the `calls` table

### Real-time updates not working
- Verify Supabase Realtime is enabled in your Supabase dashboard
- Check that the `calls` table has replication enabled
- Ensure your Supabase URL and keys are correct

### Build errors
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Expo SDK version compatibility

## Support

For issues or questions, refer to the main project README or contact support.

