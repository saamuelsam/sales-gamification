# 🎯 Sistema de Níveis e Gamificação - ATUALIZAÇÃO COMPLETA

## 📊 Resumo das Mudanças

### **1. Novos Requisitos por Nível**

#### 🌟 **ELITE (Consultant)**
- **Pontos necessários:** 0 - 1.000
- **Meta mensal obrigatória:** 1 contrato + 400 kW
- **Comissão:** 5% (venda) + 5% (seguro)
- **Bônus de avanço:** R$ 300 + Kit Fortal
- **Premiação especial:** Cesta básica ao atingir 400 kW no mês
- **Estrutura de equipe:** 1 linha apenas

#### ⚡ **MASTER (Master Consultant)**
- **Pontos necessários:** 1.000 - 10.000
- **Meta mensal obrigatória:** 2 contratos + 2.000 kW
- **Comissão:** 7% (venda) + 5% (seguro) + 2% (rede 1ª linha)
- **Bônus de avanço:** R$ 1.000 + Jantar com acompanhante
- **Regra de rebaixamento:** Se não bater meta por 3 meses consecutivos, volta para Elite
- **Estrutura de equipe:** 
  - Até 2 linhas de profundidade
  - Mínimo 5 pessoas na 1ª linha
  - Mínimo 2 pessoas na 2ª linha
  - Precisa ter consultores Elite e Master na equipe

#### 🏆 **SÊNIOR (Senior Consultant)**
- **Pontos necessários:** 10.000 - 500.000 (acumulado com equipe)
- **Meta mensal obrigatória:** 4 contratos + 5.000 kW
- **Meta de equipe:** R$ 500.000 em vendas mensais (equipe geral)
- **Comissão:** 10% (venda) + 5% (seguro) + 1,5% (rede 1ª linha)
- **Benefício fixo:** Ajuda de custo de R$ 1.518/mês
- **Bônus de avanço:** R$ 1.500 + Jantar no Ilamare com acompanhante
- **Estrutura de equipe:** 
  - Até 4 linhas de profundidade
  - Mínimo 2 linhas completas
  - Mínimo 5 pessoas na 1ª linha
  - Mínimo 2 pessoas na 2ª linha

#### 💎 **PRIME (Prime Consultant)**
- **Pontos necessários:** 500.000 - 800.000 (acumulado com equipe)
- **Meta mensal obrigatória:** 5 contratos + 10.000 kW
- **Comissão:** 12% (venda) + 5% (seguro) + 1,5% (rede 1ª linha)
- **Benefício fixo:** Ajuda de custo de R$ 1.518/mês
- **Bônus de avanço:** R$ 1.500 + Jantar no Ilamare com acompanhante
- **Estrutura de equipe:** 
  - Até 6 linhas de profundidade
  - Mínimo 4 linhas ativas na equipe

#### 👑 **EXECUTIVO (Executive)**
- **Pontos necessários:** 800.000 - 2.000.000 (acumulado com equipe)
- **Meta mensal obrigatória:** 10 contratos + 20.000 kW
- **Comissão:** 15% (venda) + 5% (seguro) + 1% (rede 1ª linha) + 0,5% por meta batida nas outras 9 linhas
- **Benefício fixo:** 
  - Base: R$ 1.518/mês
  - Com 10 vendas: sobe para R$ 5.000/mês
- **Bônus de avanço:** R$ 10.000 + Fim de semana em Balneário Camboriú
- **Vantagens:**
  - Direito a pontuação de usinas
  - Até 10 linhas de profundidade
  - Bônus de 0,5% sobre cada meta batida nas 9 linhas (além da 1ª)

---

## 🎁 Sistema de Premiações Especiais

### **Mensais:**
- **Cesta Básica:** Elite que atingir 400 kW no mês

### **Trimestrais (a cada 3 meses):**
- Troféus
- Premiações especiais

### **Anuais:**
- **Cruzeiro Top 10:** Para os 10 melhores vendedores do ano
- **Sorteio de Motos Elétricas**
- **Entrega de Celulares**
- **Viagens de Incentivo**

---

## 🔧 Implementações Técnicas

### **1. Novas Tabelas no Banco de Dados**

```sql
-- Histórico de mudanças de nível
CREATE TABLE user_level_history (...)

-- Requisitos de estrutura de equipe
CREATE TABLE team_structure_requirements (...)

-- Bônus de avanço de nível
CREATE TABLE advancement_bonuses (...)

-- Premiações especiais
CREATE TABLE special_rewards (...)

-- Metas mensais obrigatórias
CREATE TABLE monthly_targets (...)
```

### **2. Novos Campos em `users`**

```sql
ALTER TABLE users ADD COLUMN:
- monthly_contracts INTEGER
- monthly_kilowatts DECIMAL(12,2)
- months_below_target INTEGER
- last_target_check DATE
- fixed_allowance DECIMAL(10,2)
- bonus_allowance DECIMAL(10,2)
```

### **3. Novos Serviços**

#### **MonthlyTargetService** (`monthlyTarget.service.ts`)
- `updateUserMonthlyStats()` - Atualiza contadores após venda
- `checkMonthlyTarget()` - Verifica se bateu meta
- `checkAllUsersTargets()` - Verifica todos os usuários (mensal)
- `demoteUser()` - Rebaixa usuário após 3 meses sem meta
- `resetMonthlyCounters()` - Reset no início do mês
- `checkTeamStructure()` - Verifica estrutura da equipe
- `calculateTeamPoints()` - Calcula pontos acumulados da equipe

#### **RewardsService** (`rewards.service.ts`)
- `registerAdvancementBonus()` - Registra bônus de avanço
- `registerBasicBasket()` - Registra cesta básica (Elite 400kW)
- `registerQuarterlyTrophy()` - Registra troféu trimestral
- `registerAnnualCruise()` - Registra cruzeiro Top 10
- `listPendingRewards()` - Lista prêmios pendentes
- `markRewardAsDelivered()` - Marca prêmio como entregue
- `listPendingBonuses()` - Lista bônus pendentes de pagamento
- `markBonusAsPaid()` - Marca bônus como pago
- `updateExecutiveAllowance()` - Atualiza ajuda de custo do executivo
- `checkAndAwardBasicBasket()` - Verifica e atribui cesta automaticamente

### **4. Script de Manutenção Mensal**

```bash
# Executar no 1º dia de cada mês
npm run monthly-maintenance
```

**Ações automáticas:**
1. Verifica metas do mês anterior
2. Identifica usuários abaixo da meta
3. Rebaixa usuários após 3 meses sem bater meta
4. Reseta contadores mensais
5. Gera relatório de premiações pendentes
6. Gera relatório de bônus pendentes
7. Estatísticas gerais do mês

### **5. Agendar no Crontab (Servidor)**

```bash
# Editar crontab
crontab -e

# Adicionar linha (executa todo dia 1 às 00:00)
0 0 1 * * cd /var/www/sales-gamification/backend && npm run monthly-maintenance >> /var/log/monthly-maintenance.log 2>&1
```

---

## 📋 Checklist de Deploy

### **1. Banco de Dados**
- [ ] Executar migration `028_update_levels_config_complete.sql`
- [ ] Verificar se todas as tabelas foram criadas
- [ ] Verificar se os campos foram adicionados em `users`

### **2. Backend**
- [ ] Atualizar código no servidor (`git pull`)
- [ ] Instalar dependências (`npm install`)
- [ ] Executar migrations (`npm run migrate`)
- [ ] Rebuild e restart dos containers

### **3. Configuração do Cron**
- [ ] Agendar `monthly-maintenance` no crontab
- [ ] Testar execução manual: `npm run monthly-maintenance`
- [ ] Verificar logs em `/var/log/monthly-maintenance.log`

### **4. Validações**
- [ ] Criar venda e verificar atualização de contadores
- [ ] Verificar cálculo de pontos com equipe (Sênior+)
- [ ] Testar rebaixamento (simular 3 meses sem meta)
- [ ] Verificar registro de bônus ao subir de nível
- [ ] Testar cesta básica automática (Elite com 400kW)

---

## 🚀 Como Testar

### **1. Testar Metas Mensais**
```sql
-- Ver contadores de um usuário
SELECT 
  name, 
  role, 
  monthly_contracts, 
  monthly_kilowatts, 
  months_below_target
FROM users 
WHERE email = 'consultor@example.com';
```

### **2. Testar Estrutura de Equipe**
```sql
-- Ver estrutura da equipe de um líder
WITH RECURSIVE team AS (
  SELECT id, parent_id, role, 1 as depth
  FROM user_hierarchy
  WHERE leader_id = 'USER_ID_AQUI'
  
  UNION ALL
  
  SELECT uh.id, uh.parent_id, u.role, team.depth + 1
  FROM user_hierarchy uh
  INNER JOIN team ON team.id = uh.parent_id
  INNER JOIN users u ON u.id = uh.id
  WHERE team.depth < 10
)
SELECT depth, COUNT(*) as members, array_agg(DISTINCT role) as roles
FROM team
GROUP BY depth;
```

### **3. Testar Bônus Pendentes**
```sql
-- Ver bônus não pagos
SELECT 
  u.name,
  ab.from_level,
  ab.to_level,
  ab.bonus_amount,
  ab.awarded_at
FROM advancement_bonuses ab
JOIN users u ON u.id = ab.user_id
WHERE paid = false;
```

### **4. Testar Premiações**
```sql
-- Ver premiações não entregues
SELECT 
  u.name,
  sr.reward_type,
  sr.reward_description,
  sr.awarded_at
FROM special_rewards sr
JOIN users u ON u.id = sr.user_id
WHERE delivered = false;
```

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verificar logs do backend: `docker logs sales_backend`
2. Verificar logs do cron: `tail -f /var/log/monthly-maintenance.log`
3. Consultar este documento

---

**Última atualização:** Novembro 2025
