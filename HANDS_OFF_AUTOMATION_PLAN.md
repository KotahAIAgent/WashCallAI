# Making FusionCaller Fully Hands-Off: Self-Service Automation Plan

## Current Manual Admin Steps

1. **Vapi Assistant ID Setup** - Admin must set `inbound_agent_id` and `outbound_agent_id` via admin panel
2. **Phone Number Setup** - Admin must add phone numbers via admin panel
3. **Setup Status Approval** - Admin must manually approve setup status ('pending' → 'active')

## Automation Plan

### ✅ Already Automated
- Webhook configuration (automatic when assistant ID is set)
- Access check function configuration (automatic)
- Stripe subscription management (self-service)
- Onboarding form (self-service)
- Trial activation (self-service)

### 🔄 To Be Automated

#### 1. Self-Service Assistant ID Configuration
- **Add to InboundConfigForm**: Allow clients to enter their own Vapi Assistant ID
- **Add to OutboundConfigForm**: Allow clients to enter their own Vapi Assistant ID
- **Create `setAgentId` action**: Client-facing version that validates organization membership
- **Add instructions**: Link to Vapi dashboard with step-by-step guide

#### 2. Self-Service Phone Number Management
- **Create `AddPhoneNumberForm` component**: Allow clients to add their own phone numbers
- **Create `addPhoneNumber` action**: Client-facing version that validates organization membership
- **Add to Settings or Inbound/Outbound pages**: Make it easily accessible
- **Add instructions**: Link to Vapi dashboard for getting phone number IDs

#### 3. Auto-Approve Setup Status
- **Auto-set to 'active'**: When client completes onboarding AND subscribes to a plan
- **Remove setup status banner**: Once status is 'active', hide the banner
- **Optional**: Auto-set to 'active' when they add their first assistant ID

#### 4. Enhanced Instructions & Help
- **Vapi Dashboard Links**: Direct links to create assistants and get phone numbers
- **Step-by-step guides**: Visual guides for setting up Vapi assistants
- **Video tutorials**: Links to video tutorials (if available)
- **Help page updates**: Add self-service setup instructions

## Implementation Priority

1. **High Priority** (Makes biggest impact):
   - Self-service Assistant ID configuration
   - Auto-approve setup status on subscription

2. **Medium Priority**:
   - Self-service phone number management
   - Enhanced instructions

3. **Low Priority** (Nice to have):
   - Video tutorials
   - Advanced automation (auto-create assistants via API)

## Files to Modify

1. `src/lib/agents/actions.ts` - Add `setAgentId` and `addPhoneNumber` client actions
2. `src/components/agents/InboundConfigForm.tsx` - Add assistant ID input field
3. `src/components/agents/OutboundConfigForm.tsx` - Add assistant ID input field
4. `src/components/settings/AddPhoneNumberForm.tsx` - NEW: Self-service phone number form
5. `src/app/app/settings/page.tsx` - Add phone number management section
6. `src/lib/onboarding/actions.ts` - Auto-set setup_status to 'active' on subscription
7. `src/app/api/auth/stripe/webhook/route.ts` - Auto-set setup_status to 'active' when subscription created
8. `src/components/onboarding/SetupStatusBanner.tsx` - Hide when status is 'active'

