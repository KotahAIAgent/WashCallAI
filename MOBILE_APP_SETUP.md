# Mobile App Setup Guide

This guide will help you set up the FusionCaller mobile app so your clients can view live inbound calls on their phones.

## Overview

The mobile app is built with **React Native and Expo**, allowing you to:
- Deploy to both iOS and Android
- Use the same Supabase backend as your web app
- Provide real-time call notifications
- Give clients instant access to call information

## Quick Start

### 1. Install Dependencies

```bash
cd mobile-app
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `mobile-app` directory:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

You can copy these values from your main app's `.env.local` file.

### 3. Start Development Server

```bash
npm start
```

Then:
- Press `i` to open in iOS Simulator (requires Xcode on Mac)
- Press `a` to open in Android Emulator (requires Android Studio)
- Scan the QR code with Expo Go app on your phone

## Features

### ✅ Real-time Call Monitoring
- Clients see inbound calls as they happen
- Live status updates (ringing → in-progress → completed)
- Automatic notifications when calls arrive

### ✅ Push Notifications
- Instant alerts for new inbound calls
- Shows caller number and call status
- Tap notification to view call details

### ✅ Call Details
- Full call transcripts
- AI-generated summaries
- Call duration and timestamps
- Recording links (when available)

### ✅ Dashboard
- Total calls count
- Inbound vs outbound breakdown
- Leads and appointments statistics

## Building for Production

### Option 1: Expo Application Services (EAS) - Recommended

1. **Install EAS CLI:**
```bash
npm install -g eas-cli
```

2. **Login to Expo:**
```bash
eas login
```

3. **Configure your project:**
```bash
eas build:configure
```

4. **Build for iOS:**
```bash
eas build --platform ios
```

5. **Build for Android:**
```bash
eas build --platform android
```

6. **Submit to App Stores:**
```bash
# iOS
eas submit --platform ios

# Android
eas submit --platform android
```

### Option 2: Local Builds

For local builds, you'll need:
- **iOS**: Xcode and Apple Developer account
- **Android**: Android Studio and Google Play Developer account

See [Expo's documentation](https://docs.expo.dev/build/introduction/) for detailed instructions.

## App Store Requirements

### iOS App Store
- Apple Developer account ($99/year)
- App Store Connect account
- App icons and screenshots
- Privacy policy URL

### Google Play Store
- Google Play Developer account ($25 one-time)
- App icons and screenshots
- Privacy policy URL

## Configuration

### App Name and Branding

Edit `mobile-app/app.json` to customize:
- App name
- Bundle identifier
- App icon
- Splash screen

### Notification Settings

The app automatically requests notification permissions. To customize:

1. Edit `mobile-app/app.json` - notification plugin settings
2. Configure notification sounds in `mobile-app/assets/`
3. Update notification content in `mobile-app/app/(tabs)/index.tsx`

## Testing

### Development Testing
1. Use Expo Go app on your phone
2. Scan QR code from `npm start`
3. Test real-time features with actual calls

### Production Testing
1. Build with EAS: `eas build --platform ios --profile preview`
2. Install on test devices via TestFlight (iOS) or internal testing (Android)
3. Test all features before submitting to stores

## Real-time Setup Verification

Ensure Supabase Realtime is enabled:

1. Go to Supabase Dashboard → Database → Replication
2. Verify `calls` table has replication enabled
3. If not, run this SQL in Supabase SQL Editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
```

## Push Notifications Setup

### iOS
1. Configure APNs in Expo Dashboard
2. Add your Apple Developer certificates
3. EAS will handle certificate management

### Android
1. Firebase Cloud Messaging (FCM) is automatically configured
2. No additional setup needed for Android

## Client Distribution

### Option 1: App Stores (Recommended)
- Submit to App Store and Google Play
- Clients download from stores
- Automatic updates via stores

### Option 2: TestFlight/Internal Testing
- iOS: Use TestFlight for beta testing
- Android: Use Google Play internal testing
- Limited to 10,000 testers (iOS) or unlimited (Android)

### Option 3: Direct Distribution
- Build standalone APK/IPA files
- Distribute directly to clients
- Manual updates required

## Monitoring and Analytics

Consider adding:
- **Expo Analytics**: Built-in analytics
- **Sentry**: Error tracking
- **Firebase Analytics**: User behavior tracking

## Security Considerations

1. **API Keys**: Never commit `.env` files
2. **Authentication**: Uses Supabase Auth (same as web app)
3. **RLS Policies**: Same Row Level Security as web app
4. **Token Storage**: Secure storage via AsyncStorage

## Troubleshooting

### "Supabase connection failed"
- Check `.env` file has correct values
- Verify Supabase project is active
- Check network connectivity

### "Notifications not working"
- Ensure permissions are granted in device settings
- Check notification configuration in `app.json`
- Verify `expo-notifications` is installed

### "Real-time updates not showing"
- Verify Supabase Realtime is enabled
- Check `calls` table replication is on
- Ensure user is authenticated

### "Build fails"
- Clear cache: `expo start -c`
- Update dependencies: `npm update`
- Check Expo SDK version compatibility

## Next Steps

1. ✅ Test the app in development
2. ✅ Customize branding and icons
3. ✅ Build for production
4. ✅ Submit to app stores
5. ✅ Distribute to clients
6. ✅ Monitor usage and feedback

## Support

For issues:
1. Check Expo documentation: https://docs.expo.dev
2. Review Supabase Realtime docs: https://supabase.com/docs/guides/realtime
3. Check main project README for backend setup

## Cost Considerations

- **Expo EAS**: Free tier available, paid plans for more builds
- **App Store**: $99/year (iOS), $25 one-time (Android)
- **Supabase**: Uses same backend as web app (no additional cost)
- **Push Notifications**: Included in Expo/EAS plans

The mobile app uses your existing Supabase backend, so there are no additional database costs.

