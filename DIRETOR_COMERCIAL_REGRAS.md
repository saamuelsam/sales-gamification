# 👔 Diretor Comercial - Regras e Comissionamento

## 📋 Visão Geral

O **Diretor Comercial** é responsável pela expansão da rede Fortal Engenharia Solar, com foco em crescimento e desenvolvimento de equipe.

## 💰 Estrutura de Comissionamento

### Vendas Pessoais
- **Comissão base**: 10% sobre o valor da venda
- **Comissão de seguro**: 5% sobre o valor do seguro vendido
- **Total pessoal**: 15% (10% + 5%)

### Comissão de Rede

#### 🔥 Regra Geral (Master, Sênior, Prime, Executive)
- **Recebem APENAS da 1ª linha**
- **Recebem APENAS de consultores Elite**
- Se o subordinado for Master ou superior, **NÃO recebe comissão**
- Taxa: conforme nível (2%, 1.5%, 1%)

#### 🎯 Diretor Comercial (EXCEÇÃO)

##### 1ª Linha (Diretos)
- **Taxa**: 2% sobre vendas de qualquer nível (Elite, Master, Sênior, etc.)

##### Resto da Rede (2ª linha em diante)
- **Taxa**: 0.5% sobre vendas de TODA a rede, qualquer nível
- Não tem restrição de nível ou linha
- Único cargo que recebe de toda a estrutura

## 🎯 Meta Mensal

Para manutenção do cargo:
- **7 vendedores ativos** na rede por mês (em qualquer linha)
- Considera qualquer vendedor com pelo menos 1 venda no mês
- Deve cumprir o padrão de pontos igual aos demais níveis

## 📊 Exemplo de Comissionamento

### Cenário 1: Venda de R$ 100.000

**Venda Pessoal do Diretor:**
- Comissão base: R$ 100.000 × 10% = **R$ 10.000**
- Seguro (R$ 5.000): R$ 5.000 × 5% = **R$ 250**
- **Total pessoal: R$ 10.250**

**Venda de Consultor Elite Direto (1ª linha):**
- Comissão de rede: R$ 100.000 × 2% = **R$ 2.000**

**Venda de Master Direto (1ª linha):**
- Comissão de rede: R$ 100.000 × 2% = **R$ 2.000**

**Venda de Master na 3ª linha:**
- Comissão de rede: R$ 100.000 × 0.5% = **R$ 500**

**Venda de Elite na 4ª linha:**
- Comissão de rede: R$ 100.000 × 0.5% = **R$ 500**

### Cenário 2: Master com Elite na 1ª linha

**Master recebe:**
- Venda de Elite direto (1ª linha): 2% ✅
- Venda de Master direto (1ª linha): 0% ❌
- Venda de Elite na 2ª linha: 0% ❌

**Diretor Comercial recebe:**
- Venda de qualquer nível na 1ª linha: 2% ✅
- Venda de qualquer nível na 2ª+ linha: 0.5% ✅

## 🔄 Regras de Progressão

O Diretor Comercial segue as mesmas regras de progressão dos demais níveis:
- ✅ Pontos pessoais + pontos da equipe (Master+)
- ✅ Deve manter vendas mensais
- ✅ Não pode ficar 3 meses sem contratos
- ✅ Meta específica: 7 vendedores ativos/mês

## 📈 Estrutura de Equipe

- **Linhas permitidas**: Até 10 níveis de profundidade
- **Foco**: Expansão e desenvolvimento de rede
- **Diferencial**: Comissionamento estendido para toda rede Master+

## 🔧 Implementação Técnica

### Banco de Dados

```sql
-- Nível criado com:
phase_number: 6
role: 'diretor_comercial'
personal_commission: 10.0
insurance_commission: 5.0
network_commission: 2.0 (1ª linha) / 0.5 (resto Master+)
monthly_sales_goal: 7 (vendedores ativos)
```

### Lógica de Comissionamento

```typescript
// commission.service.ts
if (leader.role === 'diretor_comercial' && lineLevel > 1) {
  commissionRate = 0.5; // Resto da rede master+
} else {
  commissionRate = 2.0; // 1ª linha
}
```

## ✅ Validações

- [x] Comissão pessoal: 10% + 5% seguro
- [x] Comissão 1ª linha: 2%
- [x] Comissão resto da rede Master+: 0.5%
- [x] Elite não gera comissão de rede
- [x] Meta: 7 vendedores ativos/mês
- [x] Pontos de equipe contam para progressão

## 📝 Observações Importantes

1. **Apenas níveis Master ou superior** na rede geram comissão de 0.5%
2. **Consultores Elite** não contam para comissão de rede
3. **Meta de 7 vendedores** pode ser em qualquer linha da rede
4. **Vendedor ativo** = pelo menos 1 venda no mês
5. Segue regras padrão de rebaixamento (3 meses sem vendas)

## 🚀 Como Promover um Usuário

```bash
# 1. Atualizar constraint (se necessário)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (
    'admin', 'ceo', 'director', 'executive', 'prime_consultant',
    'senior_consultant', 'master_consultant', 'consultant', 'diretor_comercial'
));

# 2. Promover usuário
UPDATE users 
SET role = 'diretor_comercial', 
    email_verified = true, 
    is_active = true 
WHERE email = 'usuario@email.com';
```

---

**Data de Criação**: 14/11/2025  
**Status**: ✅ Implementado e Ativo
