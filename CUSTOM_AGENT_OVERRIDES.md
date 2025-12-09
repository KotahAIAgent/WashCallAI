# Custom Agent Overrides

This feature allows you to override Vapi agent settings with custom configurations from the website. This is perfect for white-labeling where multiple clients use the same base Vapi agent but with different business names, service areas, and greetings.

## How It Works

When a client configures their business name, service area, and custom greeting in the website, these values are stored in the `agent_configs` table and passed to Vapi as **variables** when making calls. These variables override the default settings in the Vapi agent.

## Setup Instructions

### 1. Run the Database Migration

Run this SQL in your Supabase dashboard:

```sql
-- Add custom variable fields to agent_configs
ALTER TABLE agent_configs 
  ADD COLUMN IF NOT EXISTS custom_business_name TEXT,
  ADD COLUMN IF NOT EXISTS custom_service_area TEXT,
  ADD COLUMN IF NOT EXISTS custom_greeting TEXT,
  ADD COLUMN IF NOT EXISTS custom_variables JSONB DEFAULT '{}'::jsonb;
```

### 2. Configure Your Vapi Agent

In your Vapi agent configuration, make sure your agent uses variables like:
- `{{businessName}}` - The business name
- `{{serviceArea}}` - The service area
- `{{customGreeting}}` - Custom greeting (if provided)

Example in your Vapi agent prompt:
```
You are the AI receptionist for {{businessName}}. 
We serve the {{serviceArea}} area.
{{#if customGreeting}}
{{customGreeting}}
{{/if}}
```

### 3. Client Configuration

When a client (like Nano Seal) sets up their account:

1. They go to **Inbound AI** or **Outbound AI** settings
2. They enter:
   - **Business Name**: "Nano Seal" (overrides the Vapi agent default)
   - **Service Area**: "Dallas-Fort Worth metro area" (overrides Vapi agent default)
   - **Custom Greeting**: Optional custom greeting

3. These values are saved to `agent_configs.custom_business_name`, `custom_service_area`, and `custom_greeting`

### 4. How Calls Work

**Outbound Calls:**
- When making an outbound call, the system:
  1. Fetches the organization and agent config
  2. Builds a `variables` object with custom values
  3. Passes these variables to Vapi API when initiating the call
  4. Vapi uses these variables to override the agent's default settings

**Inbound Calls:**
- For inbound calls, you'll need to configure your Vapi agent to use a `serverUrl` that dynamically injects variables
- Or configure the phone number in Vapi to use variables from the webhook

## Example: Nano Seal Setup

1. **Admin sets up agent**: Uses "DSH Pressure Washing" Vapi agent ID
2. **Client configures website**: 
   - Business Name: "Nano Seal"
   - Service Area: "Dallas-Fort Worth"
   - Custom Greeting: "Thank you for calling Nano Seal..."
3. **When calls are made**: Vapi receives variables:
   ```json
   {
     "businessName": "Nano Seal",
     "serviceArea": "Dallas-Fort Worth",
     "customGreeting": "Thank you for calling Nano Seal..."
   }
   ```
4. **Vapi agent uses these values** instead of the default "DSH Pressure Washing" settings

## Additional Custom Variables

You can also store additional custom variables in the `custom_variables` JSONB field:

```sql
UPDATE agent_configs 
SET custom_variables = '{"pricing": "$150-$300", "specialOffer": "10% off first service"}'::jsonb
WHERE organization_id = '...';
```

These will be merged with the standard variables when making calls.

## Notes

- Custom business name takes precedence over organization name
- Custom service area takes precedence over organization service_areas
- If custom values aren't set, the system falls back to organization values
- The Vapi agent must be configured to use these variables in its prompt/script

