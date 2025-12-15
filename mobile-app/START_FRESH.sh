#!/bin/bash
cd "/Users/dakkotahester/Desktop/NEW AI Agent/mobile-app"

echo "🧹 Cleaning up..."
# Kill any existing processes
lsof -ti:8081 | xargs kill -9 2>/dev/null
lsof -ti:8082 | xargs kill -9 2>/dev/null
pkill -f "expo" 2>/dev/null
sleep 2

echo "🗑️  Clearing caches..."
rm -rf .expo
rm -rf node_modules/.cache

echo "🚀 Starting Expo..."
echo ""
echo "📱 Next steps:"
echo "1. Wait for QR code (may take 30-60 seconds)"
echo "2. Open Expo Go app on your phone"
echo "3. Scan the QR code"
echo "4. Make sure phone and computer are on same WiFi!"
echo ""

# Try offline mode first
npx expo start --offline --port 8081

