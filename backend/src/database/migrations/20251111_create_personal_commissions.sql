-- ===============================================
-- 🔹 Migration: Create personal_commissions
-- 🔹 Author: Sam / Sales Gamification
-- 🔹 Date: 2025-11-11
-- 🔹 Context: Controle de comissões pessoais (vendas diretas)
-- ===============================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS personal_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 🔹 Usuário que realizou a venda
    user_id UUID NOT NULL,
    -- 🔹 Venda associada (opcional)
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,

    -- 🔹 Percentual e valor da comissão
    commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 5 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
    commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),

    -- 🔹 Pontos gerados pela venda
    points NUMERIC(10,2) DEFAULT 0 CHECK (points >= 0),

    -- 🔹 Controle de pagamento
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP NULL,

    -- 🔹 Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 🔹 Constraints
    CONSTRAINT fk_personal_comm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_personal_comm_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
    CONSTRAINT unique_personal_commission UNIQUE (user_id, sale_id)
);

-- 🔹 Índices otimizados
CREATE INDEX IF NOT EXISTS idx_personal_comm_user ON personal_commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_comm_sale ON personal_commissions(sale_id);
CREATE INDEX IF NOT EXISTS idx_personal_comm_paid ON personal_commissions(paid);
CREATE INDEX IF NOT EXISTS idx_personal_comm_created_at ON personal_commissions(created_at DESC);

-- 🔹 Comentários detalhados
COMMENT ON TABLE personal_commissions IS
'Tabela de controle das comissões pessoais (vendas diretas realizadas pelo consultor).';

COMMENT ON COLUMN personal_commissions.user_id IS
'ID do consultor que realizou a venda.';

COMMENT ON COLUMN personal_commissions.sale_id IS
'ID da venda associada à comissão pessoal.';

COMMENT ON COLUMN personal_commissions.commission_percentage IS
'Percentual aplicado sobre o valor da venda conforme o nível do consultor.';

COMMENT ON COLUMN personal_commissions.commission_amount IS
'Valor monetário da comissão calculada.';

COMMENT ON COLUMN personal_commissions.points IS
'Pontuação em kW gerada pela venda (1 kW = 1 ponto).';

COMMENT ON COLUMN personal_commissions.paid IS
'Status de pagamento da comissão (TRUE = paga, FALSE = pendente).';

COMMENT ON COLUMN personal_commissions.created_at IS
'Data e hora de criação do registro da comissão.';

COMMENT ON COLUMN personal_commissions.updated_at IS
'Data da última atualização no registro (controle de auditoria).';

COMMIT;
