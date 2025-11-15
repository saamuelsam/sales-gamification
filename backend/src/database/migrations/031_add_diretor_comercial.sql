-- =====================================================
-- 031_add_diretor_comercial.sql
-- Adiciona role 'diretor_comercial' ao sistema
-- =====================================================

-- 1. Remover constraint antigo de role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Adicionar novo constraint incluindo diretor_comercial
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (
    'admin', 
    'ceo', 
    'director', 
    'executive', 
    'prime_consultant',
    'senior_consultant', 
    'master_consultant', 
    'consultant', 
    'diretor_comercial'
));

-- 3. Adicionar nível Diretor Comercial na tabela levels
INSERT INTO levels (
    phase_number, 
    name, 
    subtitle, 
    role, 
    points_required, 
    personal_commission, 
    insurance_commission, 
    network_commission, 
    max_lines, 
    fixed_allowance, 
    advancement_bonus,
    monthly_sales_goal,
    created_at
)
VALUES (
    6,
    'Diretor Comercial',
    'Diretor Comercial Fortal Engenharia Solar - Expansão',
    'diretor_comercial',
    0,
    10.0,  -- 10% comissão pessoal
    5.0,   -- 5% comissão de seguro
    2.0,   -- 2% comissão 1ª linha, 0.5% resto da rede master+
    10,    -- até 10 linhas
    0,     -- sem ajuda de custo fixa
    0,     -- sem bônus de avanço
    7,     -- META: 7 vendedores ativos na rede por mês
    NOW()
)
ON CONFLICT (phase_number) DO UPDATE 
SET 
    personal_commission = 10.0,
    insurance_commission = 5.0,
    network_commission = 2.0,
    monthly_sales_goal = 7,
    role = 'diretor_comercial',
    name = 'Diretor Comercial',
    subtitle = 'Diretor Comercial Fortal Engenharia Solar - Expansão';

-- 4. Comentários
COMMENT ON CONSTRAINT users_role_check ON users IS 'Roles válidos incluindo diretor_comercial';
