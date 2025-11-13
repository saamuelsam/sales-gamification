# 📊 Regras de Níveis e Comissões - Sistema de Gamificação

## ✅ STATUS: Implementado e Ativo

---

## 🎯 FASE 1: CONSULTOR ELITE

### Requisitos
- **Pontos para Avançar:** 1.000 pontos
- **Contratos Mínimos:** 1 contrato/mês

### Comissões
- **Comissão Pessoal:** 5% (sobre venda)
- **Comissão de Seguro:** 5% (sobre seguro)
- **Comissão de Rede:** Não possui

### Recompensas
- **Bônus de Avanço:** Cesta Básica
- **Recompensa Mensal:** Cesta Básica (ao atingir 400 kW + 1 contrato no mês)

---

## 🎯 FASE 2: MASTER CONSULTANT

### Requisitos
- **Pontos para Avançar:** 10.000 pontos
- **Contratos Mínimos:** **2 contratos/mês** (obrigatório)

### Comissões
- **Comissão Pessoal:** 7% (sobre venda)
- **Comissão de Seguro:** 5% (sobre seguro)
- **Comissão de Rede:** 2% (sobre 1ª linha)

### Recompensas
- **Bônus de Avanço:** R$ 1.000 + Jantar com acompanhante

---

## 🎯 FASE 3: CONSULTOR SÊNIOR

### Requisitos
- **Pontos para Avançar:** 500.000 pontos (equipe acumulada)
- **Contratos Mínimos:** **4 contratos/mês** (obrigatório)
- **Meta Mensal Obrigatória:** R$ 500.000 em vendas (Equipe Geral)

### Comissões
- **Comissão Pessoal:** 10% (sobre venda)
- **Comissão de Seguro:** 5% (sobre seguro)
- **Comissão de Rede:** 1,5% (sobre 1ª linha)

### Benefícios
- **Ajuda de Custo Fixa:** R$ 1.518,00/mês

### Recompensas
- **Bônus de Avanço:** R$ 1.500 + Jantar no Ilamare com acompanhante

---

## 🎯 FASE 4: CONSULTOR PRIME

### Requisitos
- **Pontos para Avançar:** 800.000 pontos (equipe acumulada)
- **Contratos Mínimos:** **5 contratos/mês** (obrigatório)

### Comissões
- **Comissão Pessoal:** 12% (sobre venda)
- **Comissão de Seguro:** 5% (sobre seguro)
- **Comissão de Rede:** 1,5% (sobre 1ª linha)

### Benefícios
- **Ajuda de Custo Fixa:** R$ 1.518,00/mês

### Recompensas
- **Bônus de Avanço:** R$ 1.500 + Jantar no Ilamare com acompanhante

---

## 🎯 FASE 5: EXECUTIVO

### Requisitos
- **Pontos para Avançar:** 2.000.000 pontos (equipe acumulada)
- **Contratos Mínimos:** **10 contratos/mês** (obrigatório)

### Comissões
- **Comissão Pessoal:** 15% (sobre venda)
- **Comissão de Seguro:** 5% (sobre seguro)
- **Comissão de Rede:** 1% (sobre 1ª linha)

### Benefícios
- **Ajuda de Custo Base:** R$ 1.518,00/mês
- **Ajuda de Custo Especial:** R$ 5.000,00/mês (ao atingir 10 vendas/mês)

### Recompensas
- **Bônus de Avanço:** R$ 10.000 + Fim de semana em Balneário Camboriú

---

## 📝 OBSERVAÇÕES IMPORTANTES

### Sistema de Pontos
- **1 kW = 1 Ponto**
- Pontos são acumulados automaticamente ao criar vendas
- A partir do Sênior, pontos da equipe também contam para progressão

### Sistema de Comissões
- **Comissões Pessoais:** Criadas automaticamente quando venda é APROVADA
- **Comissões de Rede:** Criadas automaticamente para líderes quando membros da equipe têm vendas aprovadas
- Percentuais baseados no nível atual do consultor

### Promoções Automáticas
- Sistema verifica automaticamente após cada venda aprovada
- Promoção ocorre quando pontos requeridos são atingidos
- Notificação e registro de recompensa são criados automaticamente

### Contratos Mínimos
- ⚠️ **ATENÇÃO:** Contratos mínimos mensais ainda não são validados automaticamente
- Esta funcionalidade está pendente de implementação
- Por enquanto, apenas os pontos são considerados para progressão

---

## 🔧 Arquivos Atualizados

1. **Backend:**
   - `backend/src/database/seeds/001_insert_levels.sql` - Dados dos níveis
   - `backend/src/config/levels.ts` - Configuração TypeScript
   - `backend/src/modules/sales/sales.service.ts` - Criação de comissões
   - `backend/src/modules/commissions/commission.service.ts` - Cálculo de comissões
   - `backend/src/modules/levels/level.service.ts` - Sistema de promoção

2. **Banco de Dados:**
   - Tabela `levels` atualizada com novos valores
   - Tabela `personal_commissions` criando comissões corretamente
   - Tabela `network_commissions` para comissões de rede

---

## ✅ Status de Implementação

- [x] Estrutura de níveis no banco de dados
- [x] Configuração de comissões pessoais (5%, 7%, 10%, 12%, 15%)
- [x] Configuração de comissões de seguro (5% para todos)
- [x] Configuração de comissões de rede (2%, 1.5%, 1%)
- [x] Sistema de promoção automática por pontos
- [x] Criação automática de comissões ao aprovar vendas
- [x] Registro de recompensas e notificações
- [ ] Validação de contratos mínimos mensais (PENDENTE)
- [ ] Validação de metas mensais obrigatórias (PENDENTE)
- [ ] Cálculo de pontos da equipe para promoção (PENDENTE)

---

**Data de Última Atualização:** 12/11/2025
**Versão:** 2.0
