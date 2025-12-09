-- ============================================
-- WORKFLOWS SYSTEM
-- ============================================

-- Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Workflow config
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  -- Trigger config (JSONB for flexibility)
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'new_lead', 'lead_status_changed', 'call_completed', 'appointment_booked',
    'lead_score_threshold', 'date_based', 'manual'
  )),
  trigger_config JSONB DEFAULT '{}'::jsonb,
  -- Actions config (array of actions)
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Execution tracking
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create workflow_executions table for logging
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Execution details
  trigger_event TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  -- Related entities
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflows_org ON workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflows_enabled ON workflows(organization_id, enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_org ON workflow_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);

-- Add comments
COMMENT ON TABLE workflows IS 'Automated workflows that trigger actions based on events';
COMMENT ON COLUMN workflows.trigger_config IS 'JSON configuration for trigger conditions (e.g., status values, score thresholds)';
COMMENT ON COLUMN workflows.actions IS 'Array of action objects to execute when workflow triggers';
COMMENT ON TABLE workflow_executions IS 'Log of workflow executions for debugging and monitoring';

