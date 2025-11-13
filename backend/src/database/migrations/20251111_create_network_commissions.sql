-- ===============================================
-- 🔹 Migration: Create network_commissions
-- 🔹 Author: Sam / Sales Gamification
-- 🔹 Date: 2025-11-11
-- 🔹 Context: Controle de comissões de rede (vendas indiretas)
-- ===============================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS network_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 🔹 Líder que recebe a comissão
    leader_id UUID NOT NULL,
    -- 🔹 Membro da equipe que realizou a venda
    team_member_id UUID NOT NULL,
    -- 🔹 Venda associada
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,

    -- 🔹 Percentual e valor da comissão de rede
    commission_percentage NUMERIC(5,2) NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
    commission_amount NUMERIC(12,2) NOT NULL CHECK (commission_amount >= 0),

    -- 🔹 Nível hierárquico (1 = direto)
    line_level INT DEFAULT 1 CHECK (line_level >= 1),

    -- 🔹 Controle de pagamento
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP NULL,

    -- 🔹 Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 🔹 Constraints
    CONSTRAINT fk_network_comm_leader FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_network_comm_member FOREIGN KEY (team_member_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_network_comm_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
    CONSTRAINT unique_network_commission UNIQUE (leader_id, team_member_id, sale_id)
);

-- 🔹 Índices otimizados
CREATE INDEX IF NOT EXISTS idx_network_commissions_leader ON network_commissions(leader_id);
CREATE INDEX IF NOT EXISTS idx_network_commissions_member ON network_commissions(team_member_id);
CREATE INDEX IF NOT EXISTS idx_network_commissions_sale ON network_commissions(sale_id);
CREATE INDEX IF NOT EXISTS idx_network_commissions_paid ON network_commissions(paid);
CREATE INDEX IF NOT EXISTS idx_network_commissions_created_at ON network_commissions(created_at DESC);

-- 🔹 Comentários detalhados
COMMENT ON TABLE network_commissions IS
'Tabela de controle de comissões de rede, geradas quando um subordinado realiza uma venda.';

COMMENT ON COLUMN network_commissions.leader_id IS
'ID do líder (usuário) que recebe a comissão de rede.';

COMMENT ON COLUMN network_commissions.team_member_id IS
'ID do consultor subordinado responsável pela venda.';

COMMENT ON COLUMN network_commissions.sale_id IS
'ID da venda associada à comissão de rede.';

COMMENT ON COLUMN network_commissions.commission_percentage IS
'Percentual de comissão definido conforme o nível hierárquico do líder.';

COMMENT ON COLUMN network_commissions.commission_amount IS
'Valor monetário da comissão de rede (em reais).';

COMMENT ON COLUMN network_commissions.line_level IS
'Nível hierárquico da comissão (1 = direto, 2 = indireto, etc.).';

COMMENT ON COLUMN network_commissions.paid IS
'Status de pagamento da comissão de rede (TRUE = paga, FALSE = pendente).';

COMMENT ON COLUMN network_commissions.created_at IS
'Data e hora de criação do registro de comissão.';

COMMENT ON COLUMN network_commissions.updated_at IS
'Data da última atualização no registro (controle de auditoria).';

COMMIT;
