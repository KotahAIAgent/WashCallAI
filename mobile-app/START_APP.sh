#!/bin/bash
cd "/Users/dakkotahester/Desktop/NEW AI Agent/mobile-app"

# Kill any existing Expo processes
lsof -ti:8081 | xargs kill -9 2>/dev/null
lsof -ti:8082 | xargs kill -9 2>/dev/null

# Clear cache and start
echo "🚀 Starting Expo development server..."
echo ""
echo "📱 Next steps:"
echo "1. Wait for QR code to appear"
echo "2. Open Expo Go app on your phone"
echo "3. Scan the QR code"
echo "4. Make sure phone and computer are on same WiFi!"
echo ""

npx expo start --clear

