# Dynamic Campaign Prompts Guide

## Overview

FusionCaller now supports **dynamic, campaign-specific prompts** that automatically customize your AI assistant's behavior based on the campaign type and description you set when creating a campaign.

## How It Works

1. **When you create a campaign** in FusionCaller, you select a "Call Script Type" (e.g., "Restaurant Cold Calls", "Gas Stations", etc.)
2. **When making calls** from that campaign, FusionCaller automatically generates industry-specific context
3. **This context is passed to Vapi** via `variableValues` in the API call
4. **Your Vapi assistant uses these variables** to customize its prompt dynamically

## Setting Up Your Vapi Assistant

To use dynamic prompts, you need to configure your Vapi assistant's prompt to use variables. Here's how:

### Step 1: Update Your Assistant's System Prompt

In your Vapi assistant settings, update the **System Prompt** or **First Message** to include variable placeholders:

```
You are a professional AI assistant for {{businessName}}, a pressure washing and cleaning service company.

{{dynamicPrompt}}

Your goal is to:
- Introduce {{businessName}} and our services: {{services}}
- Understand the prospect's needs in the {{industry}} industry
- Schedule a consultation or provide information about our services
- Be friendly, professional, and helpful

{{#if campaignDescription}}
Campaign Details: {{campaignDescription}}
{{/if}}

Remember: Focus on how our services benefit {{industry}} businesses specifically.
```

### Step 2: Available Variables

When you make calls from a campaign, these variables are automatically available:

| Variable | Description | Example |
|----------|-------------|---------|
| `industry` | The target industry | "restaurants", "property management", "gas stations" |
| `services` | Relevant services for this industry | "pressure washing, deep cleaning, kitchen exhaust cleaning" |
| `campaignContext` | Industry-specific context | Full context about the industry and approach |
| `campaignDescription` | Custom description from campaign | Your custom campaign description |
| `campaignName` | Name of the campaign | "Restaurant Cold Calls - January" |
| `dynamicPrompt` | Complete dynamic prompt | Full prompt combining all context |
| `businessName` | Your business name | From agent config or organization |
| `serviceArea` | Your service area | From agent config or organization |

### Step 3: Script Type Mappings

The system automatically generates context based on these script types:

#### Restaurant Cold Calls (`cold_restaurants`)
- **Industry**: restaurants
- **Services**: pressure washing, deep cleaning, kitchen exhaust cleaning, exterior maintenance
- **Context**: Focuses on hygiene, health code compliance, customer perception

#### Property Managers (`property_managers`)
- **Industry**: property management
- **Services**: building maintenance, common area cleaning, exterior cleaning
- **Context**: Focuses on maintaining multiple properties, reliability

#### Past Customers (`past_customers`)
- **Industry**: returning customers
- **Services**: follow-up cleaning, maintenance programs
- **Context**: They know your quality; focus on scheduling and additional services

#### New Leads (`new_leads`)
- **Industry**: new prospects
- **Services**: pressure washing, cleaning services
- **Context**: Introduction to services, understanding needs

#### Estimate Reminder (`estimate_reminder`)
- **Industry**: estimate follow-up
- **Services**: pressure washing, cleaning services
- **Context**: Follow-up on quotes, answer questions, move forward

#### General Outreach (`general`)
- **Industry**: general commercial
- **Services**: pressure washing, cleaning services
- **Context**: General business outreach

### Step 4: Adding Custom Script Types

To add new script types (like "Gas Stations"), you can:

1. **Add the option** in `src/components/campaigns/NewCampaignForm.tsx`:
```tsx
<SelectItem value="gas_stations">Gas Station Cold Calls</SelectItem>
```

2. **Add the mapping** in `src/lib/agents/actions.ts` in the `generateCampaignPromptContext` function:
```typescript
gas_stations: {
  industry: 'gas stations',
  services: 'pressure washing, car wash bay cleaning, fuel pump area cleaning, and canopy cleaning',
  context: 'You are calling gas stations to offer professional cleaning services. Gas stations need regular cleaning to maintain a professional appearance, ensure safety, and comply with regulations. Focus on how clean facilities improve customer experience and safety.',
},
```

## Example Vapi Assistant Prompt

Here's a complete example prompt that uses all the dynamic variables:

```
You are calling on behalf of {{businessName}}, a professional pressure washing and cleaning service company serving {{serviceArea}}.

{{dynamicPrompt}}

Your conversation should:
1. Introduce yourself and {{businessName}}
2. Briefly explain our services: {{services}}
3. Ask about their current cleaning needs
4. Explain how we can help {{industry}} businesses specifically
5. Offer to schedule a consultation or provide more information

{{#if campaignDescription}}
Additional Campaign Information: {{campaignDescription}}
{{/if}}

Be professional, friendly, and focus on understanding their needs. If they're not interested, be polite and thank them for their time.
```

## Testing

1. Create a campaign with script type "Restaurant Cold Calls"
2. Add a description like "Focusing on restaurants in downtown area"
3. Make a test call
4. Check the Vapi logs to see the `variableValues` being passed
5. The assistant should automatically use restaurant-specific language and context

## Benefits

✅ **One Assistant, Multiple Campaigns**: Use the same Vapi assistant for all campaigns
✅ **Automatic Customization**: No need to manually change prompts for each campaign
✅ **Industry-Specific**: AI automatically adapts to restaurant vs. gas station vs. property manager language
✅ **Description Integration**: Your campaign description is automatically included in the context
✅ **Scalable**: Easy to add new script types as your business grows

## Notes

- Variables are only passed when making calls from campaigns (not direct lead calls)
- If no campaign is associated, the assistant uses its default prompt
- You can combine static prompts in Vapi with dynamic variables for maximum flexibility
- The `dynamicPrompt` variable contains the complete context, or you can use individual variables for more control

