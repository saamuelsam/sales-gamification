-- Adicionar tipo 'card' ao CHECK constraint
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_sale_type_check;

ALTER TABLE sales 
  ADD CONSTRAINT sales_sale_type_check 
  CHECK (sale_type IN ('direct', 'consortium', 'cash', 'card'));
