-- 🔹 Migration: Atualizar tipos de venda (adicionar 'card' ao CHECK constraint)
-- 🔹 Versão: 2025-10-28
-- 🔹 Contexto: Adaptação para vendas via cartão no módulo Sales

BEGIN;

-- 🔸 Remover constraint antiga, se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'sales_sale_type_check'
      AND table_name = 'sales'
  ) THEN
    ALTER TABLE sales DROP CONSTRAINT sales_sale_type_check;
  END IF;
END $$;

-- 🔸 Recriar constraint com o novo tipo 'card'
ALTER TABLE sales
  ADD CONSTRAINT sales_sale_type_check
  CHECK (sale_type IN ('direct', 'consortium', 'cash', 'card'));

-- 🔸 Comentário explicativo
COMMENT ON COLUMN sales.sale_type IS
'Tipo de venda: direct (financiamento direto), consortium (consórcio), cash (à vista), card (cartão). 
Atualizado pela migration 013_add_card_type.sql (2025-10-28).';

COMMIT;
