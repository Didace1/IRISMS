-- V6: Add Sales Rep-Driven Workflow Fields
-- Description: Adds fields for Sales Rep ownership, technician work tracking, 
--              customer feedback, and simple escalation between Sales Rep and Technician

-- Add Sales Rep ownership and timestamps
ALTER TABLE repair_tasks 
ADD COLUMN IF NOT EXISTS created_by_sales_rep_id BIGINT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Add technician work tracking
ALTER TABLE repair_tasks 
ADD COLUMN IF NOT EXISTS repair_action TEXT,
ADD COLUMN IF NOT EXISTS repair_result TEXT,
ADD COLUMN IF NOT EXISTS repair_duration_minutes INTEGER;

-- Add customer feedback (recorded by Sales Rep)
ALTER TABLE repair_tasks 
ADD COLUMN IF NOT EXISTS customer_satisfied BOOLEAN,
ADD COLUMN IF NOT EXISTS customer_feedback TEXT;

-- Add simple escalation fields (Sales Rep <-> Technician only)
ALTER TABLE repair_tasks 
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT FALSE;

-- Add foreign key constraint for Sales Rep
ALTER TABLE repair_tasks 
ADD CONSTRAINT IF NOT EXISTS fk_repair_task_sales_rep 
FOREIGN KEY (created_by_sales_rep_id) REFERENCES users(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_repair_tasks_created_by_sales_rep 
ON repair_tasks(created_by_sales_rep_id);

CREATE INDEX IF NOT EXISTS idx_repair_tasks_is_escalated 
ON repair_tasks(is_escalated);

-- Note: escalation_note field already exists in the table, will reuse it for escalation reason
