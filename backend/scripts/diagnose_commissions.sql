-- 🔍 SCRIPT DE DIAGNÓSTICO DE COMISSÕES
-- Execute este script para identificar por que as comissões estão vazias

-- 1️⃣ Verificar quantas vendas existem por status
SELECT 
  status,
  COUNT(*) as total,
  SUM(value) as total_value
FROM sales
GROUP BY status
ORDER BY status;

-- 2️⃣ Listar todas as vendas (recentes)
SELECT 
  id,
  user_id,
  client_name,
  value,
  kilowatts,
  status,
  created_at
FROM sales
ORDER BY created_at DESC
LIMIT 20;

-- 3️⃣ Verificar se há registros em personal_commissions
SELECT 
  COUNT(*) as total_personal,
  SUM(commission_amount) as total_personal_amount
FROM personal_commissions;

-- 4️⃣ Verificar se há registros em network_commissions
SELECT 
  COUNT(*) as total_network,
  SUM(commission_amount) as total_network_amount
FROM network_commissions;

-- 5️⃣ Verificar registros detalhados em personal_commissions
SELECT 
  id,
  user_id,
  sale_id,
  commission_amount,
  commission_percentage,
  paid,
  created_at
FROM personal_commissions
LIMIT 20;

-- 6️⃣ Verificar registros detalhados em network_commissions
SELECT 
  id,
  leader_id,
  team_member_id,
  sale_id,
  commission_amount,
  commission_percentage,
  paid,
  created_at
FROM network_commissions
LIMIT 20;

-- 7️⃣ Verificar usuario_hierarchy (para validar estrutura de rede)
SELECT 
  id,
  leader_id,
  subordinate_id,
  line_level,
  created_at
FROM user_hierarchy
LIMIT 20;

-- 8️⃣ Listar usuários (para verificar papéis)
SELECT 
  id,
  name,
  email,
  role,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
