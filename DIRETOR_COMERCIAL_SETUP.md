# 👔 Adicionar Diretor Comercial ao Sistema

## 📋 Dados do Cargo

**Cargo:** Diretor Comercial  
**Email:** lgabriel.robertochaves56@gmail.com  

### 💰 Comissões
- **Comissão Pessoal:** 15% (10% venda + 5% seguro)
- **Comissão de Rede:**
  - 1ª e 2ª linha: 2%
  - 3ª e 4ª linha: 1.5%
  - Executivo: 0.5%

### 🎯 Permissões
- Acesso total ao sistema (mesmo nível de CEO)
- Pode visualizar e gerenciar toda a rede
- Acesso ao painel financeiro
- Pode gerar relatórios

---

## 🚀 Como Aplicar (na VPS)

### Opção 1: Upload e Execução do SQL

```bash
# 1. Fazer upload do arquivo (no seu computador)
scp add_diretor_comercial.sql root@seu-ip-vps:/root/sales-gamification/

# 2. Conectar na VPS
ssh root@seu-ip-vps

# 3. Ir para o diretório
cd /root/sales-gamification

# 4. Executar o SQL
cat add_diretor_comercial.sql | docker exec -i sales_postgres psql -U admin -d sales_gamification

# 5. Verificar se foi aplicado
docker exec -it sales_postgres psql -U admin -d sales_gamification -c "SELECT name, email, role FROM users WHERE email = 'lgabriel.robertochaves56@gmail.com';"
```

### Opção 2: Executar Comandos Manualmente

```bash
# Conectar no PostgreSQL
docker exec -it sales_postgres psql -U admin -d sales_gamification
```

Copie e cole estes comandos SQL:

```sql
-- Criar o nível
INSERT INTO levels (
    name, role, min_points, max_points, 
    commission_personal, commission_network, 
    benefits, color, created_at
) VALUES (
    'Diretor Comercial',
    'diretor_comercial',
    0, NULL, 15.0, 2.0,
    'Comissão de 10% + 5% de seguro | Comissão de rede: 2% (1ª e 2ª linha), 1.5% (3ª e 4ª linha), 0.5% (executivo)',
    '#9333EA',
    NOW()
) ON CONFLICT (role) DO UPDATE SET
    commission_personal = 15.0,
    commission_network = 2.0,
    updated_at = NOW();

-- Promover o usuário
UPDATE users 
SET role = 'diretor_comercial', email_verified = true, is_active = true
WHERE email = 'lgabriel.robertochaves56@gmail.com';

-- Verificar
SELECT name, email, role FROM users WHERE email = 'lgabriel.robertochaves56@gmail.com';

-- Sair
\q
```

---

## ✅ Verificação

Após aplicar, faça o teste:

1. **Logout e Login**
   - Faça logout do sistema
   - Faça login com: `lgabriel.robertochaves56@gmail.com`
   - Deve ter acesso ao painel administrativo

2. **Verificar Comissões**
   - Registre uma venda de teste
   - Verifique se a comissão calculada é 15% (10% + 5%)

3. **Verificar Menu**
   - Deve ver todas as opções de admin/CEO
   - Acesso ao Financeiro
   - Acesso aos Relatórios

---

## 🔧 Ajustar Comissões de Rede (Avançado)

A comissão de rede no banco é um valor único (2%). Para aplicar as comissões diferenciadas por linha (2%, 1.5%, 0.5%), você precisa modificar o código do backend:

### Arquivo: `backend/src/modules/commissions/commission.service.ts`

Procure pela função que calcula comissão de rede e adicione lógica especial para `diretor_comercial`:

```typescript
// Exemplo de lógica diferenciada
if (userRole === 'diretor_comercial') {
  if (lineLevel === 1 || lineLevel === 2) {
    commissionRate = 2.0; // 2% para 1ª e 2ª linha
  } else if (lineLevel === 3 || lineLevel === 4) {
    commissionRate = 1.5; // 1.5% para 3ª e 4ª linha
  } else if (teamMemberRole === 'executive') {
    commissionRate = 0.5; // 0.5% sobre executivos
  }
}
```

Se preferir, podemos implementar isso depois. Por hora, a comissão de 2% será aplicada em toda a rede.

---

## 📊 Estrutura de Comissão Simplificada

| Tipo | Percentual | Observação |
|------|------------|------------|
| **Venda Pessoal** | 10% | Comissão base |
| **Seguro** | 5% | Adicional sobre seguro |
| **1ª e 2ª Linha** | 2% | Comissão de rede |
| **3ª e 4ª Linha** | 1.5% | (requer código customizado) |
| **Executivo** | 0.5% | (requer código customizado) |

---

## 🎯 Próximos Passos

1. ✅ Executar o SQL na VPS
2. ✅ Verificar se usuário virou Diretor Comercial
3. ✅ Testar login e permissões
4. ⏳ (Opcional) Implementar comissões diferenciadas por linha
5. ⏳ (Opcional) Criar dashboard específico para Diretor

**Qualquer dúvida, consulte os logs:**
```bash
docker-compose logs -f backend
```
