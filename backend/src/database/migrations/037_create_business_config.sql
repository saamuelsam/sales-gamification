-- ===============================================
-- 🔧 Migration: Business Config Table
-- 🔹 Author: Code Audit - Senior Architect
-- 🔹 Date: 2025-12-06
-- 🔹 Context: Externalizar configurações hardcoded para o banco
-- ===============================================

BEGIN;

-- ========================================
-- 📊 CRIAR TABELA DE CONFIGURAÇÕES
-- ========================================

CREATE TABLE IF NOT EXISTS business_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Chave única da configuração
  config_key VARCHAR(100) UNIQUE NOT NULL,
  
  -- Valor em JSON (flexível para diferentes tipos de dados)
  config_value JSONB NOT NULL,
  
  -- Descrição da configuração
  description TEXT,
  
  -- Categoria (para organização)
  category VARCHAR(50) DEFAULT 'general',
  
  -- Controle de versão
  version INTEGER DEFAULT 1,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) DEFAULT 'SYSTEM'
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_business_config_category ON business_config(category);
CREATE INDEX IF NOT EXISTS idx_business_config_key ON business_config(config_key);

-- Comentários
COMMENT ON TABLE business_config IS 
'Tabela de configurações dinâmicas do sistema (elimina hardcoding no código)';

COMMENT ON COLUMN business_config.config_key IS 
'Chave única da configuração (ex: commission_rates, fixed_allowances)';

COMMENT ON COLUMN business_config.config_value IS 
'Valor em formato JSONB (suporta objetos complexos)';


-- ========================================
-- 📝 INSERIR CONFIGURAÇÕES PADRÃO
-- ========================================

-- 💰 Taxas de Comissão Pessoal por Role
INSERT INTO business_config (config_key, config_value, description, category) VALUES
('commission_rates_personal', 
 '{
   "consultant": 5,
   "master_consultant": 7,
   "senior_consultant": 10,
   "prime_consultant": 10,
   "executive": 13,
   "diretor_comercial": 10
 }'::jsonb,
 'Percentuais de comissão pessoal sobre venda por role',
 'commissions'
);

-- 🏥 Taxas de Comissão sobre Seguro
INSERT INTO business_config (config_key, config_value, description, category) VALUES
('commission_rates_insurance', 
 '{
   "consultant": 5,
   "master_consultant": 5,
   "senior_consultant": 5,
   "prime_consultant": 5,
   "executive": 5,
   "diretor_comercial": 5
 }'::jsonb,
 'Percentuais de comissão sobre seguro por role',
 'commissions'
);

-- 🌐 Taxas de Comissão de Rede - Primeira Linha
INSERT INTO business_config (config_key, config_value, description, category) VALUES
('commission_rates_network_line1', 
 '{
   "consultant": 0,
   "master_consultant": 2.0,
   "senior_consultant": 1.5,
   "prime_consultant": 1.5,
   "executive": 1.0,
   "diretor_comercial": 2.0
 }'::jsonb,
 'Percentuais de comissão de rede - 1ª linha',
 'commissions'
);

-- 🌐 Taxas de Comissão de Rede - Demais Linhas
INSERT INTO business_config (config_key, config_value, description, category) VALUES
('commission_rates_network_rest', 
 '{
   "consultant": 0,
   "master_consultant": 0.5,
   "senior_consultant": 0,
   "prime_consultant": 0.5,
   "executive": 0.5,
   "diretor_comercial": 0.5
 }'::jsonb,
 'Percentuais de comissão de rede - linhas 2+',
 'commissions'
);

-- 💵 Ajudas de Custo Fixas
INSERT INTO business_config (config_key, config_value, description, category) VALUES
('fixed_allowances', 
 '{
   "consultant": 0,
   "master_consultant": 0,
   "senior_consultant": 1518,
   "prime_consultant": 1518,
   "executive": 1518,
   "diretor_comercial": 1518
 }'::jsonb,
 'Ajudas de custo mensais fixas por role (em reais)',
 'benefits'
);

-- 🎯 Metas Mensais de kW
INSERT INTO business_config (config_key, config_value, description, category) VALUES
('monthly_kw_targets', 
 '{
   "consultant": 0,
   "master_consultant": 4000,
   "senior_consultant": 5000,
   "prime_consultant": 10000,
   "executive": 600000,
   "diretor_comercial": 600000
 }'::jsonb,
 'Metas mensais de kW por role',
 'targets'
);

-- 📋 Metas Mensais de Contratos
INSERT INTO business_config (config_key, config_value, description, category) VALUES
('monthly_contract_targets', 
 '{
   "consultant": 1,
   "master_consultant": 2,
   "senior_consultant": 4,
   "prime_consultant": 5,
   "executive": 10,
   "diretor_comercial": 10
 }'::jsonb,
 'Metas mensais de contratos por role',
 'targets'
);

-- 🏆 Pontos para Avanço de Nível
INSERT INTO business_config (config_key, config_value, description, category) VALUES
('level_advancement_points', 
 '{
   "consultant": 1000,
   "master_consultant": 10000,
   "senior_consultant": 400000,
   "prime_consultant": 800000,
   "executive": 2000000
 }'::jsonb,
 'Pontos necessários para avançar de nível',
 'levels'
);

-- 🎁 Bônus de Avanço
INSERT INTO business_config (config_key, config_value, description, category) VALUES
('advancement_bonuses', 
 '{
   "master_consultant": 1000,
   "senior_consultant": 1500,
   "prime_consultant": 1500,
   "executive": 10000
 }'::jsonb,
 'Bônus monetário ao avançar de nível (em reais)',
 'rewards'
);

-- 🎁 Prêmios de Avanço
INSERT INTO business_config (config_key, config_value, description, category) VALUES
('advancement_rewards', 
 '{
   "consultant": "Kit Fortal",
   "master_consultant": "Jantar no Sal e Brasa com acompanhante",
   "senior_consultant": "Jantar no Grand Parrilla Steak House",
   "prime_consultant": "Jantar no Ilamare com acompanhante",
   "executive": "Fim de semana em Balneário Camboriú"
 }'::jsonb,
 'Prêmios não-monetários ao avançar de nível',
 'rewards'
);

-- 🔢 Profundidade Máxima de Rede por Role
INSERT INTO business_config (config_key, config_value, description, category) VALUES
('max_network_depth', 
 '{
   "consultant": 0,
   "master_consultant": 2,
   "senior_consultant": 4,
   "prime_consultant": 6,
   "executive": 10,
   "diretor_comercial": 10
 }'::jsonb,
 'Número máximo de níveis de rede que cada role recebe comissão',
 'commissions'
);

-- 🛡️ Penalidades - Meses sem Meta
INSERT INTO business_config (config_key, config_value, description, category) VALUES
('penalty_months_below_target', 
 '{"months_to_reset_points": 3, "months_to_demote": 0}'::jsonb,
 'Meses consecutivos sem meta para zerar pontos ou rebaixar',
 'penalties'
);


-- ========================================
-- 🔄 TRIGGER PARA ATUALIZAR updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_business_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_business_config_timestamp
  BEFORE UPDATE ON business_config
  FOR EACH ROW
  EXECUTE FUNCTION update_business_config_timestamp();


COMMIT;

-- ========================================
-- 📝 INSTRUÇÕES DE USO
-- ========================================
-- Para atualizar uma configuração:
-- UPDATE business_config 
-- SET config_value = '{"consultant": 6}'::jsonb
-- WHERE config_key = 'commission_rates_personal';

-- Para buscar uma configuração:
-- SELECT config_value->'consultant' FROM business_config 
-- WHERE config_key = 'commission_rates_personal';
