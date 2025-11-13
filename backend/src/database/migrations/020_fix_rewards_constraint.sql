-- ===============================================
-- 🧩 Migration: Corrigir constraint de reward_type
-- 🔹 Adiciona 'level_up' aos valores permitidos
-- 🔹 Data: 2025-11-12
-- ===============================================

BEGIN;

-- Remover constraint antiga
ALTER TABLE rewards DROP CONSTRAINT IF EXISTS rewards_reward_type_check;

-- Adicionar nova constraint com 'level_up' incluído
ALTER TABLE rewards ADD CONSTRAINT rewards_reward_type_check 
  CHECK (reward_type IN ('cesta_basica', 'bonus', 'prize', 'trip', 'level_up', 'custom'));

COMMIT;
