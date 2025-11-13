# Sistema de Comissões - Documentação Completa

## 📊 Visão Geral

A página de **Comissões** é o centro financeiro para consultores acompanharem seus ganhos no sistema de gamificação de vendas. O sistema possui **dois tipos de comissões**:

### 1. **Comissões Pessoais** 💰
- Ganhas quando você **faz uma venda direta**
- Percentual baseado no seu **nível/cargo** (5% a 15%)
- Gera **pontos em kW** para progressão de carreira
- Exemplo: Venda de R$ 10.000 com 7% = R$ 700 de comissão

### 2. **Comissões de Rede** 👥
- Ganhas quando **membros da sua equipe** fazem vendas
- Percentual baseado no **nível hierárquico** (3% a 5%)
- Incentiva construção e liderança de equipe
- Exemplo: Venda de R$ 8.000 pelo subordinado com 3% = R$ 240 de comissão

---

## 🎯 Funcionalidades da Página

### **1. Cards de Resumo Financeiro** (4 KPIs principais)

#### 📈 Total Ganho
- Soma de **todas as comissões** (pessoais + rede)
- Cor: Verde
- Ícone: DollarSign com TrendingUp

#### ✅ Comissões Pagas
- Valor já **recebido/depositado**
- Cor: Azul
- Status: "Recebidas"

#### ⏳ Comissões Pendentes
- Valor **aguardando pagamento**
- Cor: Amarelo
- Status: "Aguardando pagamento"

#### 👥 Comissões de Rede
- Total ganho especificamente **da equipe**
- Cor: Roxo
- Mostra força da rede

---

### **2. Breakdown Detalhado** (2 cards laterais)

#### 💚 Comissões Pessoais
- Card verde com breakdown:
  * Total ganho (vendas diretas)
  * Já recebido
  * Pendente
- Ícone: Award (troféu)

#### 💜 Comissões de Rede
- Card roxo com breakdown:
  * Total ganho (equipe)
  * Já recebido
  * Pendente
- Ícone: Users (pessoas)

---

### **3. Gráfico de Evolução Mensal** 📊

- **LineChart** com dados dos últimos **6 meses**
- Eixo X: Meses (formato curto: "nov/25")
- Eixo Y: Valores em R$
- Cor da linha: Verde (#10B981)
- Pontos interativos com tooltip
- Mostra crescimento/tendência

**Exemplo de dados:**
```javascript
[
  { month: 'jun/25', amount: 1250.50 },
  { month: 'jul/25', amount: 1800.00 },
  { month: 'ago/25', amount: 2100.75 },
  // ...
]
```

---

### **4. Tabs de Visualização** (Personal vs Network)

#### Tab: Comissões Pessoais 🏆
**Colunas da tabela:**
1. **Data** - Quando a venda foi feita
2. **Cliente** - Nome do cliente
3. **Valor Venda** - Total da venda (R$)
4. **%** - Percentual de comissão aplicado
5. **Comissão** - Valor ganho (verde)
6. **Pontos** - kW gerados
7. **Status** - Badge (Paga/Pendente)

**Badges de Status:**
- ✅ **Paga**: Verde com CheckCircle
- ⏳ **Pendente**: Amarelo com Clock

#### Tab: Comissões de Rede 👥
**Colunas da tabela:**
1. **Data** - Quando a venda foi feita
2. **Vendedor** - Nome + email do membro da equipe
3. **Cliente** - Nome do cliente
4. **Valor Venda** - Total da venda
5. **%** - Percentual de comissão de rede
6. **Comissão** - Valor ganho (roxo)
7. **Nível** - Badge com nível hierárquico (1, 2, 3...)
8. **Status** - Badge (Paga/Pendente)

**Badge de Nível:**
- Roxo com texto "Nível 1" (direto), "Nível 2" (indireto), etc.

---

### **5. Filtros e Busca** 🔍

#### **Filtro de Status** (Dropdown)
- **Todas**: Mostra todas as comissões
- **Pagas**: Apenas comissões já recebidas
- **Pendentes**: Apenas aguardando pagamento

#### **Busca por Texto**
- Pesquisa por:
  * Nome do **cliente** (pessoais e rede)
  * Nome do **vendedor** (apenas rede)
  * Email do **vendedor** (apenas rede)
- Ícone: Search (lupa)
- Placeholder: "Buscar..."

---

### **6. Ações Disponíveis** ⚙️

#### 🔄 Botão Atualizar
- Recarrega todos os dados
- Útil para ver comissões recém-criadas
- Ícone: RefreshCw

#### 📥 Botão Exportar CSV
- Gera arquivo CSV da tab ativa
- Nome do arquivo: `comissoes_personal_2025-11-12.csv` ou `comissoes_network_2025-11-12.csv`
- Separador: ponto-e-vírgula (;)
- Compatível com Excel/LibreOffice

**Colunas do CSV (Pessoal):**
```
Data;Cliente;Valor Venda;Percentual;Comissão;Pontos;Status
12/11/2025;João Silva;R$ 10000.00;7%;R$ 700.00;50 kW;Paga
```

**Colunas do CSV (Rede):**
```
Data;Vendedor;Cliente;Valor Venda;Percentual;Comissão;Nível;Status
12/11/2025;Maria Santos;João Silva;R$ 8000.00;3%;R$ 240.00;Nível 1;Pendente
```

---

## 🎨 Design e UX

### **Dark Mode Completo** 🌙
- Todas as cores adaptadas para tema escuro
- Cards com `dark:bg-gray-800`
- Bordas com `dark:border-gray-700`
- Textos com `dark:text-gray-100`
- Badges ajustados para dark mode

### **Responsividade** 📱
- **Mobile**: Cards empilhados, tabela com scroll horizontal
- **Tablet**: 2 colunas nos cards, tabs responsivas
- **Desktop**: 4 colunas nos cards, tabelas completas

### **Estados de Interface**

#### Loading State
```tsx
<div className="flex items-center justify-center min-h-screen">
  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
  <p>Carregando comissões...</p>
</div>
```

#### Empty State (Sem comissões)
- Ícone grande (Award ou Users)
- Mensagem personalizada por tipo
- Dica de ação (fazer vendas ou construir equipe)

---

## 🔌 Integração Backend

### **Endpoints Utilizados**

#### 1. GET `/api/commissions/summary`
**Response:**
```json
{
  "success": true,
  "data": {
    "personal": {
      "total_earned": 8500.00,
      "total_paid": 3000.00,
      "total_unpaid": 5500.00
    },
    "network": {
      "total_earned": 1240.00,
      "total_paid": 400.00,
      "total_unpaid": 840.00
    },
    "total_earned": 9740.00,
    "total_paid": 3400.00,
    "total_pending": 6340.00
  }
}
```

#### 2. GET `/api/commissions/personal`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sale_id": "uuid",
      "commission_percentage": 7,
      "commission_amount": 700.00,
      "points": 50,
      "paid": true,
      "created_at": "2025-11-10T14:30:00Z",
      "sale_value": 10000.00,
      "client_name": "João Silva"
    }
  ]
}
```

#### 3. GET `/api/commissions/network`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sale_id": "uuid",
      "team_member_name": "Maria Santos",
      "team_member_email": "maria@email.com",
      "commission_percentage": 3,
      "commission_amount": 240.00,
      "line_level": 1,
      "paid": false,
      "created_at": "2025-11-11T10:00:00Z",
      "sale_value": 8000.00,
      "client_name": "Cliente XYZ"
    }
  ]
}
```

#### 4. GET `/api/commissions/monthly`
**Response:**
```json
{
  "success": true,
  "data": [
    { "month": "2025-06", "amount": 1250.50 },
    { "month": "2025-07", "amount": 1800.00 },
    { "month": "2025-08", "amount": 2100.75 }
  ]
}
```

---

## 📐 Estrutura do Banco de Dados

### **Tabela: personal_commissions**
```sql
CREATE TABLE personal_commissions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,              -- Consultor que fez a venda
  sale_id UUID REFERENCES sales(id),   -- Venda associada
  commission_percentage NUMERIC(5,2),  -- Ex: 7.00
  commission_amount NUMERIC(12,2),     -- Ex: 700.00
  points NUMERIC(10,2),                -- kW gerados
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Tabela: network_commissions**
```sql
CREATE TABLE network_commissions (
  id UUID PRIMARY KEY,
  leader_id UUID NOT NULL,            -- Líder que recebe
  team_member_id UUID NOT NULL,       -- Membro que vendeu
  sale_id UUID REFERENCES sales(id),
  commission_percentage NUMERIC(5,2),
  commission_amount NUMERIC(12,2),
  line_level INT DEFAULT 1,           -- Nível hierárquico
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Como Funciona o Cálculo

### **Comissão Pessoal**
```javascript
// 1. Consultor faz venda de R$ 10.000
// 2. Sistema busca percentual do nível do consultor (ex: 7%)
// 3. Calcula: 10.000 × 0.07 = R$ 700
// 4. Gera pontos: 50 kW (baseado na venda)
// 5. Insere em personal_commissions
```

### **Comissão de Rede**
```javascript
// 1. Subordinado faz venda de R$ 8.000
// 2. Sistema identifica líder direto
// 3. Busca percentual de rede do líder (ex: 3%)
// 4. Calcula: 8.000 × 0.03 = R$ 240
// 5. Insere em network_commissions com line_level = 1
```

---

## 💡 Dicas de Uso

### **Para Consultores:**
1. ✅ Monitore suas comissões pendentes
2. 📊 Use o gráfico mensal para acompanhar crescimento
3. 📥 Exporte CSV para controle pessoal
4. 🎯 Foque em vendas diretas (maior percentual)

### **Para Líderes:**
1. 👥 Acompanhe vendas da equipe na tab "Rede"
2. 📈 Comissões de rede são passivas (equipe trabalha por você)
3. 🔍 Use busca para filtrar por membro específico
4. 💰 Construa equipe maior = mais comissões de rede

---

## 🎯 Métricas de Sucesso

### **KPIs Importantes:**
- **Taxa de conversão**: Pendentes → Pagas
- **Crescimento mensal**: Comparação mês a mês
- **Mix de comissões**: % Pessoal vs % Rede
- **Média por venda**: Commission_amount / total_vendas

### **Exemplo de Análise:**
```
Mês Atual:
- Total: R$ 5.000
- Pessoal: R$ 3.500 (70%)
- Rede: R$ 1.500 (30%)

Meta: Equilibrar em 60% pessoal / 40% rede
Ação: Recrutar e treinar mais membros
```

---

## 🔒 Segurança e Permissões

### **Acesso à Página:**
- ✅ Todos os usuários autenticados
- ✅ Consultores veem apenas suas comissões
- ✅ Líderes veem comissões pessoais + rede da equipe
- ❌ Sem cross-user access (isolamento de dados)

### **Validações:**
- Token JWT obrigatório
- User ID extraído do token (req.user.userId)
- Queries filtradas por user_id/leader_id

---

## 📱 Status da Implementação

✅ **Completo:**
- Interface UI/UX com dark mode
- 4 cards de resumo financeiro
- 2 cards de breakdown (pessoal/rede)
- Gráfico mensal com Recharts
- Tabs com tabelas detalhadas
- Filtros por status e busca
- Export CSV funcional
- Loading e empty states
- Integração com 4 endpoints
- Queries otimizadas com JOINs
- Dados de teste criados

🎉 **Pronto para uso!**

---

## 📚 Tecnologias Utilizadas

- **Frontend:** React + TypeScript + TailwindCSS
- **Charts:** Recharts (LineChart)
- **Icons:** lucide-react
- **Backend:** Node.js + Express + PostgreSQL
- **Estado:** Zustand (auth)
- **Notificações:** react-hot-toast

---

## 🔄 Fluxo Completo de Comissão

```
1. VENDA CRIADA
   └─> POST /api/sales

2. PROCESSAMENTO AUTOMÁTICO
   └─> commissionService.processPersonalCommission()
   └─> commissionService.processNetworkCommission()

3. INSERÇÃO NO BANCO
   └─> INSERT INTO personal_commissions
   └─> INSERT INTO network_commissions

4. CONSULTOR VISUALIZA
   └─> GET /api/commissions/summary
   └─> GET /api/commissions/personal
   └─> GET /api/commissions/network
   └─> GET /api/commissions/monthly

5. FINANCEIRO APROVA
   └─> PATCH /api/admin/commissions/:id/paid

6. COMISSÃO MARCADA COMO PAGA
   └─> UPDATE ... SET paid = TRUE, paid_at = NOW()
```

---

## 🎓 Exemplo Completo

### **Cenário:**
João é consultor nível Master (7%) e tem 2 subordinados: Maria e Pedro.

**Mês de Novembro:**

1. João faz 3 vendas diretas:
   - R$ 10.000 → Comissão: R$ 700 (pessoal)
   - R$ 15.000 → Comissão: R$ 1.050 (pessoal)
   - R$ 8.000 → Comissão: R$ 560 (pessoal)
   - **Total pessoal: R$ 2.310**

2. Maria faz 2 vendas:
   - R$ 12.000 → João recebe 3% = R$ 360 (rede)
   - R$ 9.000 → João recebe 3% = R$ 270 (rede)

3. Pedro faz 1 venda:
   - R$ 20.000 → João recebe 3% = R$ 600 (rede)
   - **Total rede: R$ 1.230**

### **Resultado na Página de Comissões:**

**Cards de Resumo:**
- Total Ganho: **R$ 3.540**
- Comissões Pagas: **R$ 1.500** (pagas no mês anterior)
- Pendentes: **R$ 2.040** (aguardando)
- Comissões de Rede: **R$ 1.230**

**Tab Pessoais (3 linhas):**
| Data       | Cliente   | Valor     | %  | Comissão | Pontos | Status    |
|------------|-----------|-----------|----|---------:|-------:|-----------|
| 12/11/2025 | Cliente A | R$ 10.000 | 7% | R$ 700   | 50 kW  | Pendente  |
| 10/11/2025 | Cliente B | R$ 15.000 | 7% | R$ 1.050 | 75 kW  | Pendente  |
| 08/11/2025 | Cliente C | R$ 8.000  | 7% | R$ 560   | 40 kW  | Paga      |

**Tab Rede (3 linhas):**
| Data       | Vendedor | Cliente   | Valor     | %  | Comissão | Nível   | Status   |
|------------|----------|-----------|-----------|----|---------:|---------|----------|
| 11/11/2025 | Maria    | Cliente D | R$ 12.000 | 3% | R$ 360   | Nível 1 | Pendente |
| 09/11/2025 | Maria    | Cliente E | R$ 9.000  | 3% | R$ 270   | Nível 1 | Pendente |
| 07/11/2025 | Pedro    | Cliente F | R$ 20.000 | 3% | R$ 600   | Nível 1 | Paga     |

---

Documentação criada por: AI Assistant
Data: 12/11/2025
Versão: 1.0
Status: ✅ Produção
