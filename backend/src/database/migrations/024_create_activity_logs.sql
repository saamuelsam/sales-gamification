-- Migration: Create activity_logs table
-- Description: Table to store all system activity logs for auditing and monitoring
-- Created: 2024

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action VARCHAR(255) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraint (nullable for system actions)
  CONSTRAINT fk_activity_logs_user
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);

-- Add comment to table
COMMENT ON TABLE activity_logs IS 'Registro de todas as atividades do sistema para auditoria';
COMMENT ON COLUMN activity_logs.user_id IS 'ID do usuário que realizou a ação (NULL para ações do sistema)';
COMMENT ON COLUMN activity_logs.action IS 'Descrição da ação realizada';
COMMENT ON COLUMN activity_logs.metadata IS 'Dados adicionais sobre a ação em formato JSON';
COMMENT ON COLUMN activity_logs.created_at IS 'Data e hora da ação';
