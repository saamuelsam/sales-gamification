-- ===============================================
-- 🔹 Migration: Adicionar coluna 'role' à tabela levels
-- 🔹 Autor: Sam / Sales Gamification
-- 🔹 Data: 2025-11-12
-- ===============================================

BEGIN;

ALTER TABLE levels
  ADD COLUMN IF NOT EXISTS role VARCHAR(50);

-- Atualizar roles correspondentes aos níveis
UPDATE levels SET role = 'consultant' WHERE phase_number = 1;
UPDATE levels SET role = 'master_consultant' WHERE phase_number = 2;
UPDATE levels SET role = 'senior_consultant' WHERE phase_number = 3;
UPDATE levels SET role = 'prime_consultant' WHERE phase_number = 4;
UPDATE levels SET role = 'executive' WHERE phase_number = 5;

COMMENT ON COLUMN levels.role IS
'Papel (role) associado a cada fase de nível de carreira. Usado para promover usuários automaticamente.';

COMMIT;
