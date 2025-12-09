-- Add custom variable fields to agent_configs for overriding Vapi agent settings
ALTER TABLE agent_configs 
  ADD COLUMN IF NOT EXISTS custom_business_name TEXT,
  ADD COLUMN IF NOT EXISTS custom_service_area TEXT,
  ADD COLUMN IF NOT EXISTS custom_greeting TEXT,
  ADD COLUMN IF NOT EXISTS custom_variables JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining usage
COMMENT ON COLUMN agent_configs.custom_business_name IS 'Overrides business name in Vapi agent (takes precedence over organization name)';
COMMENT ON COLUMN agent_configs.custom_service_area IS 'Custom service area to pass to Vapi agent';
COMMENT ON COLUMN agent_configs.custom_greeting IS 'Custom greeting to override Vapi agent default';
COMMENT ON COLUMN agent_configs.custom_variables IS 'Additional custom variables to pass to Vapi agent (JSON object)';

