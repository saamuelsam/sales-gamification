-- Limpar tabela
TRUNCATE TABLE levels CASCADE;

-- Inserir os 5 níveis do plano de carreira Fortal Energia Solar
INSERT INTO levels (
  phase_number, name, subtitle, points_required, max_lines,
  personal_commission, insurance_commission, network_commission,
  fixed_allowance, monthly_sales_goal, bonus_goal, bonus_allowance,
  advancement_bonus, advancement_reward
) VALUES

-- FASE 1: Consultor Elite
(
  1, 
  'Consultor Elite',
  'O ponto de partida da sua jornada',
  0,           -- Sem linhas
  0,           -- Começa sem equipe
  5.00,        -- 5% comissão venda
  5.00,        -- 5% comissão seguro
  NULL,        -- SEM comissão de rede
  NULL,        -- SEM ajuda de custo
  NULL,        -- SEM meta mensal obrigatória
  NULL,
  NULL,
  300.00,      -- R$ 300 de bônus ao avançar
  'Kit Fortal'
),

-- FASE 2: Master
(
  2,
  'Master',
  'Expandindo sua liderança e seus ganhos',
  1000,        -- Meta: 1.000 pontos
  2,           -- 2 linhas
  7.00,        -- 7% comissão venda
  5.00,        -- 5% comissão seguro
  2.00,        -- 2% comissão de rede (1ª linha)
  NULL,        -- SEM ajuda de custo fixa
  NULL,        -- SEM meta mensal obrigatória
  NULL,
  NULL,
  1000.00,     -- R$ 1.000 de bônus ao avançar
  'Jantar com direito a acompanhante'
),

-- FASE 3: Consultor Sênior
(
  3,
  'Consultor Sênior',
  'Hora de gerenciar e multiplicar resultados',
  10000,       -- Meta: 10.000 pontos
  4,           -- 4 linhas
  10.00,       -- 10% comissão venda
  5.00,        -- 5% comissão seguro
  1.50,        -- 1,5% comissão de rede (1ª linha)
  1518.00,     -- R$ 1.518 ajuda de custo FIXA
  400000.00,   -- Meta mensal obrigatória: R$ 400.000 em vendas (equipe)
  NULL,
  NULL,
  1500.00,     -- R$ 1.500 de bônus ao avançar
  'Jantar no Llamare com acompanhante'
),

-- FASE 4: Consultor Prime
(
  4,
  'Consultor Prime',
  'Elite da empresa',
  300000,      -- Meta: 300.000 pontos
  6,           -- 6 linhas
  10.00,       -- 10% comissão venda
  5.00,        -- 5% comissão seguro
  1.50,        -- 1,5% comissão de rede (1ª linha)
  1518.00,     -- R$ 1.518 ajuda de custo FIXA
  400000.00,   -- Meta mensal obrigatória: R$ 400.000 em vendas (equipe)
  NULL,
  NULL,
  1500.00,     -- R$ 1.500 de bônus ao avançar
  'Jantar no Llamare com acompanhante'
),

-- FASE 5: Executivo
(
  5,
  'Executivo',
  'O topo da carreira',
  2000000,     -- Meta: 2.000.000 pontos
  10,          -- 10 linhas
  15.00,       -- 15% comissão venda
  5.00,        -- 5% comissão seguro
  1.00,        -- 1% comissão de rede (1ª linha)
  1518.00,     -- R$ 1.518 ajuda de custo BASE
  400000.00,   -- Meta mensal obrigatória: R$ 400.000 em vendas (equipe)
  700000.00,   -- Bônus de meta: R$ 700.000 em vendas
  5000.00,     -- Ajuda de custo sobe para R$ 5.000 ao atingir meta bônus
  10000.00,    -- R$ 10.000 de bônus ao avançar
  'Fim de semana em Balneário Camboriú'
);
