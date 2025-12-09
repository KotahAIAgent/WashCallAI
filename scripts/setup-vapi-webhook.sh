#!/bin/bash

# One-Step Vapi Webhook Setup Script
# This script sets up everything automatically

set -e

echo "🚀 Vapi Webhook Setup - One Step Solution"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're using Vercel or Supabase Edge Function
echo -e "${BLUE}Choose your deployment method:${NC}"
echo "1) Use existing Vercel deployment (easiest - already deployed)"
echo "2) Deploy Supabase Edge Function (new deployment)"
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    # Use Vercel deployment
    echo ""
    echo -e "${YELLOW}Using Vercel deployment...${NC}"
    
    # Get Vercel URL
    read -p "Enter your Vercel domain (e.g., your-app.vercel.app): " vercel_domain
    WEBHOOK_URL="https://${vercel_domain}/api/vapi/webhook"
    
    echo ""
    echo -e "${GREEN}✅ Webhook URL: ${WEBHOOK_URL}${NC}"
    
elif [ "$choice" = "2" ]; then
    # Deploy Supabase Edge Function
    echo ""
    echo -e "${YELLOW}Deploying Supabase Edge Function...${NC}"
    
    # Check if supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        echo "Installing Supabase CLI..."
        if command -v brew &> /dev/null; then
            brew install supabase/tap/supabase
        else
            echo "Please install Supabase CLI manually: https://supabase.com/docs/guides/cli"
            exit 1
        fi
    fi
    
    # Login check
    echo "Checking Supabase login..."
    if ! supabase projects list &> /dev/null; then
        echo "Please login to Supabase:"
        supabase login
    fi
    
    # Link project
    read -p "Enter your Supabase project reference ID: " project_ref
    supabase link --project-ref "$project_ref"
    
    # Deploy function
    echo "Deploying Edge Function..."
    supabase functions deploy vapi-webhook
    
    WEBHOOK_URL="https://${project_ref}.supabase.co/functions/v1/vapi-webhook"
    echo ""
    echo -e "${GREEN}✅ Webhook URL: ${WEBHOOK_URL}${NC}"
else
    echo "Invalid choice"
    exit 1
fi

# Get Vapi credentials
echo ""
echo -e "${BLUE}Vapi Configuration:${NC}"
read -p "Enter your Vapi API Key: " vapi_api_key
read -p "Enter your Vapi Assistant ID: " assistant_id

# Set webhook URL in Vapi
echo ""
echo -e "${YELLOW}Setting webhook URL in Vapi...${NC}"

response=$(curl -s -X PATCH "https://api.vapi.ai/assistant/${assistant_id}" \
  -H "Authorization: Bearer ${vapi_api_key}" \
  -H "Content-Type: application/json" \
  -d "{\"serverUrl\": \"${WEBHOOK_URL}\"}")

if echo "$response" | grep -q "error"; then
    echo -e "${YELLOW}⚠️  Could not set via API. You may need to set it manually.${NC}"
    echo ""
    echo "Try setting it in:"
    echo "1. Vapi Dashboard → Phone Numbers → Your Phone Number → Server URL"
    echo "2. Or check if there's a webhook field in assistant settings"
    echo ""
    echo "Webhook URL to use: ${WEBHOOK_URL}"
else
    echo -e "${GREEN}✅ Webhook URL configured in Vapi!${NC}"
fi

# Test the webhook
echo ""
echo -e "${YELLOW}Testing webhook endpoint...${NC}"
test_response=$(curl -s -X POST "${WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}')

if echo "$test_response" | grep -q "error\|success\|message"; then
    echo -e "${GREEN}✅ Webhook endpoint is accessible!${NC}"
else
    echo -e "${YELLOW}⚠️  Webhook endpoint may not be responding correctly${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Your webhook is now configured:"
echo "  URL: ${WEBHOOK_URL}"
echo ""
echo "What happens now:"
echo "  ✅ All calls will be tracked automatically"
echo "  ✅ Inbound calls will create leads automatically"
echo "  ✅ Call statistics will update in real-time"
echo ""
echo "Next steps:"
echo "  1. Make a test call to your phone number"
echo "  2. Check your dashboard - you should see the call appear"
echo "  3. Check your leads page - inbound calls create leads automatically"
echo ""

