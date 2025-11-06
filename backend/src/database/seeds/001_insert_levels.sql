-- backend/src/database/seeds/001_insert_levels.sql

INSERT INTO levels (
  phase_number, 
  name, 
  subtitle,
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
) VALUES

-- FASE 1: Consultor Elite
(1, 'Consultor Elite', 'O ponto de partida da sua jornada', 0, 1, 5.00, 5.00, NULL, NULL, NULL, NULL, NULL, 0.00, 'Kit Fortal'),

-- FASE 2: Master
(2, 'Master', 'Expandindo sua liderança e seus ganhos', 1000, 2, 7.00, 5.00, 2.00, NULL, NULL, NULL, NULL, 1000.00, 'Jantar com acompanhante'),

-- FASE 3: Consultor Sênior
(3, 'Consultor Sênior', 'Hora de gerenciar e multiplicar resultados', 10000, 4, 10.00, 5.00, 1.50, 1518.00, 400000.00, NULL, NULL, 1500.00, 'Jantar no Ilamare com acompanhante'),

-- FASE 4: Consultor Prime
(4, 'Consultor Prime', 'Elite da empresa', 300000, 6, 12.00, 5.00, 1.50, 1518.00, 800000.00, NULL, NULL, 1500.00, 'Jantar no Ilamare com acompanhante'),

-- FASE 5: Executivo
(5, 'Executivo', 'O topo da carreira', 2000000, 10, 15.00, 5.00, 1.00, 1518.00, 400000.00, 700000.00, 5000.00, 10000.00, 'Fim de semana em Balneário Camboriú')

ON CONFLICT (phase_number) DO NOTHING;
