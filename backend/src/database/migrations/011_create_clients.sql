-- 🔹 Criar tabela de clientes (Fortal Engenharia Solar CRM)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,

  cpf VARCHAR(14) UNIQUE,
  phone VARCHAR(20),
  email VARCHAR(255) UNIQUE,

  cep VARCHAR(10),
  street VARCHAR(255),
  number VARCHAR(20),
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2) CHECK (char_length(state) = 2),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_clients_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- 🔹 Índices otimizados
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON clients(cpf);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- 🔹 Adicionar relacionamento com vendas (sales)
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS client_id UUID
  REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client_id);

-- 🔹 Comentários explicativos
COMMENT ON TABLE clients IS
'Tabela de clientes vinculados aos consultores. Cada cliente pode ter várias vendas.';

COMMENT ON COLUMN clients.cpf IS
'CPF do cliente (único). Usado para identificação e prevenção de duplicatas.';

COMMENT ON COLUMN clients.email IS
'Endereço de e-mail único do cliente.';

COMMENT ON COLUMN clients.user_id IS
'Consultor responsável pelo relacionamento e vendas ao cliente.';
