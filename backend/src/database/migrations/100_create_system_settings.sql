-- Migration: Criar tabela de configurações do sistema
-- Data: 2025-11-25
-- Objetivo: Permitir ADM ativar/desativar funcionalidades

CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir configuração de contratos por mês (ativada por padrão)
INSERT INTO system_settings (setting_key, setting_value, description, created_at)
VALUES 
  ('contracts_per_month_enabled', 'true', 'Ativa/desativa a validação de contratos mínimos mensais para progressão de nível', NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Comentários
COMMENT ON TABLE system_settings IS 'Configurações globais do sistema gerenciadas pelo administrador';
COMMENT ON COLUMN system_settings.setting_key IS 'Chave única da configuração (ex: contracts_per_month_enabled)';
COMMENT ON COLUMN system_settings.setting_value IS 'Valor da configuração (string que pode ser boolean, number, json, etc)';
COMMENT ON COLUMN system_settings.description IS 'Descrição da funcionalidade que esta configuração controla';
COMMENT ON COLUMN system_settings.updated_by IS 'ID do usuário que fez a última alteração';

-- Permissões
GRANT SELECT ON system_settings TO admin;
GRANT UPDATE ON system_settings TO admin;
