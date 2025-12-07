#!/bin/bash

# Test script for 6-month credit system
# Usage: ./scripts/test-credit-system.sh

set -e

echo "🧪 Testing 6-Month Credit System"
echo "================================"
echo ""

# Check if CRON_SECRET is set
if [ -z "$CRON_SECRET" ]; then
  echo "❌ CRON_SECRET not set. Please set it in your environment."
  exit 1
fi

# Get the app URL from environment or use default
APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"

echo "📍 Testing endpoint: ${APP_URL}/api/cron/process-setup-credits"
echo ""

# Test the cron endpoint
response=$(curl -s -w "\n%{http_code}" -X POST \
  "${APP_URL}/api/cron/process-setup-credits" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json")

# Extract status code and body
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"
echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" -eq 200 ]; then
  echo "✅ Cron endpoint is working!"
else
  echo "❌ Cron endpoint returned error status: $http_code"
  exit 1
fi

echo ""
echo "📋 Next steps:"
echo "1. Check Supabase for organizations with credits applied"
echo "2. Verify Stripe customer balances were updated"
echo "3. Check notifications were created"
echo ""

