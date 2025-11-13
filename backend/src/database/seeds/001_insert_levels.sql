-- ===============================================
-- 🧩 Seed: Inserção dos níveis de carreira
-- 🔹 Autor: Sam / Sales Gamification
-- 🔹 Data: 2025-11-12
-- ===============================================

INSERT INTO levels (
  phase_number, 
  name, 
  subtitle,
  role,
  points_required,
  max_lines,
  personal_commission, 
  insurance_commission,
  network_commission,
  fixed_allowance,
  monthly_sales_goal,
  bonus_goal,
  bonus_allowance,
  advancement_bonus,
  advancement_reward
)
VALUES
  -- 🔸 FASE 1: Consultor Elite
  -- Meta: 1.000 pontos | Bônus: Cesta Básica (ao atingir meta)
  (1, 'Consultor Elite', 'O ponto de partida da sua jornada', 'consultant', 0, 1, 5.00, 5.00, NULL, 0.00, 0.00, NULL, NULL, 0.00, 'Cesta Básica'),

  -- 🔸 FASE 2: Master Consultant  
  -- Meta: 10.000 pontos | Mínimo: 2 contratos/mês | Rede: 2% (1ª linha)
  -- Bônus: R$ 1.000 + Jantar com acompanhante
  (2, 'Master', 'Expandindo sua liderança e seus ganhos', 'master_consultant', 1000, 2, 7.00, 5.00, 2.00, 0.00, 0.00, NULL, NULL, 1000.00, 'R$ 1.000 + Jantar com acompanhante'),

  -- 🔸 FASE 3: Consultor Sênior
  -- Meta: 500.000 pontos (equipe acumulada) | Mínimo: 4 contratos/mês
  -- Meta Mensal Obrigatória: R$ 500.000 em vendas (Equipe Geral)
  -- Ajuda de Custo: R$ 1.518 | Rede: 1,5% (1ª linha)
  -- Bônus: R$ 1.500 + Jantar no Ilamare com acompanhante
  (3, 'Consultor Sênior', 'Hora de gerenciar e multiplicar resultados', 'senior_consultant', 10000, 4, 10.00, 5.00, 1.50, 1518.00, 500000.00, NULL, NULL, 1500.00, 'R$ 1.500 + Jantar Ilamare com acompanhante'),

  -- 🔸 FASE 4: Consultor Prime
  -- Meta: 800.000 pontos (equipe acumulada) | Mínimo: 5 contratos/mês
  -- Ajuda de Custo: R$ 1.518 | Rede: 1,5% (1ª linha)
  -- Bônus: R$ 1.500 + Jantar no Ilamare com acompanhante
  (4, 'Consultor Prime', 'Elite da empresa', 'prime_consultant', 500000, 6, 12.00, 5.00, 1.50, 1518.00, 0.00, NULL, NULL, 1500.00, 'R$ 1.500 + Jantar Ilamare com acompanhante'),

  -- 🔸 FASE 5: Executivo
  -- Meta: 2.000.000 pontos (equipe) | Mínimo: 10 contratos/mês
  -- Ajuda de Custo: R$ 1.518 (sobe para R$ 5.000 ao atingir 10 vendas)
  -- Rede: 1% (1ª linha)
  -- Bônus: R$ 10.000 + Fim de semana em Balneário Camboriú
  (5, 'Executivo', 'O topo da carreira', 'executive', 800000, 10, 15.00, 5.00, 1.00, 1518.00, 0.00, NULL, 5000.00, 10000.00, 'R$ 10.000 + Fim de semana em Balneário Camboriú')
ON CONFLICT (phase_number)
DO UPDATE SET
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  role = EXCLUDED.role,
  points_required = EXCLUDED.points_required,
  personal_commission = EXCLUDED.personal_commission,
  insurance_commission = EXCLUDED.insurance_commission,
  network_commission = EXCLUDED.network_commission,
  fixed_allowance = EXCLUDED.fixed_allowance,
  monthly_sales_goal = EXCLUDED.monthly_sales_goal,
  bonus_goal = EXCLUDED.bonus_goal,
  bonus_allowance = EXCLUDED.bonus_allowance,
  advancement_bonus = EXCLUDED.advancement_bonus,
  advancement_reward = EXCLUDED.advancement_reward;
