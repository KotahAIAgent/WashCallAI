# If you're getting 500 error, try these in order:

## Option 1: Offline Mode (Bypasses Expo servers)
```bash
cd "/Users/dakkotahester/Desktop/NEW AI Agent/mobile-app"
npx expo start --offline
```

## Option 2: Without environment variables
```bash
cd "/Users/dakkotahester/Desktop/NEW AI Agent/mobile-app"
EXPO_NO_DOTENV=1 npx expo start
```

## Option 3: Use localhost only
```bash
cd "/Users/dakkotahester/Desktop/NEW AI Agent/mobile-app"
npx expo start --localhost
```

## Option 4: Tunnel mode (if network is issue)
```bash
cd "/Users/dakkotahester/Desktop/NEW AI Agent/mobile-app"
npx expo start --tunnel
```

## Option 5: Clear everything and start fresh
```bash
cd "/Users/dakkotahester/Desktop/NEW AI Agent/mobile-app"
rm -rf .expo node_modules/.cache
npx expo start --clear --offline
```

## If nothing works:
The 500 error is from Expo's config validation service. You can:
1. Check your internet connection
2. Try using a VPN (sometimes Expo servers have regional issues)
3. Wait a few minutes and try again (could be temporary Expo server issue)

