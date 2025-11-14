-- Migration: Adicionar níveis administrativos (CEO, Financeiro, Admin, Diretor)
-- Data: 2025-11-14

-- Adicionar níveis administrativos que não participam da gamificação
INSERT INTO levels (phase_number, name, subtitle, role, points_required, personal_commission, network_commission, max_lines, insurance_commission, fixed_allowance, monthly_sales_goal, advancement_bonus, created_at)
VALUES 
  (0, 'CEO', 'Administrador do Sistema', 'ceo', 0, 0, 0, 999, 0, 0, 0, 0, NOW()),
  (0, 'Financeiro', 'Gestão Financeira', 'financeiro', 0, 0, 0, 999, 0, 0, 0, 0, NOW()),
  (0, 'Admin', 'Administrador', 'admin', 0, 0, 0, 999, 0, 0, 0, 0, NOW()),
  (0, 'Diretor', 'Diretoria', 'director', 0, 0, 0, 999, 0, 0, 0, 0, NOW())
ON CONFLICT DO NOTHING;

-- Comentários
COMMENT ON TABLE levels IS 'Níveis de gamificação e roles administrativos';
