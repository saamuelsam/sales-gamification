-- ===============================================
-- 🧩 Migration: Criar tabela login_logs
-- 🔹 Registra tentativas de login e atividades de autenticação
-- 🔹 Data: 2025-11-12
-- ===============================================

BEGIN;

-- 🔸 Tabela de Logs de Login
CREATE TABLE IF NOT EXISTS login_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id UUID NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  action VARCHAR(50) NOT NULL DEFAULT 'login',
  success BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_login_logs_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE
);

-- 🔸 Índices para performance
CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_created ON login_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_action ON login_logs(action);

-- 🔸 Comentários explicativos
COMMENT ON TABLE login_logs IS
'Tabela de auditoria de logins e atividades de autenticação do sistema.';

COMMENT ON COLUMN login_logs.user_id IS
'ID do usuário que realizou a ação.';

COMMENT ON COLUMN login_logs.action IS
'Tipo de ação: login, logout, failed_login, etc.';

COMMIT;
