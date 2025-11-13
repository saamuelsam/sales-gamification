# Sistema de Hierarquia de Acesso - Documentação

## Estrutura de Roles (Hierarquia)

```
CEO (Nível mais alto)
├── Acesso total ao sistema
├── ✅ Área Financeira
├── ✅ Área Administrativa
└── ✅ Todas as funcionalidades

FINANCEIRO
├── Acesso apenas à área financeira
├── ✅ Gerenciar comissões
├── ✅ Aprovar pagamentos
├── ✅ Exportar relatórios financeiros
└── ❌ SEM acesso ao painel administrativo

ADMIN
├── Acesso apenas à área administrativa
├── ✅ Gerenciar usuários
├── ✅ Configurar sistema
├── ✅ Visualizar logs e acessos
├── ✅ Enviar notificações
└── ❌ SEM acesso à área financeira

CONSULTANT (Consultores)
├── Acesso às funcionalidades básicas
├── ✅ Dashboard pessoal
├── ✅ Vendas
├── ✅ Equipe
├── ✅ Comissões pessoais
├── ✅ Benefícios
└── ❌ Sem áreas administrativas
```

## Implementação Técnica

### 1. Backend - Middlewares (`backend/src/middleware/admin.middleware.ts`)

```typescript
// CEO - Acesso total
verifyCEOMiddleware()

// Financeiro - CEO + Financeiro
verifyFinanceiroMiddleware()

// Admin - CEO + Admin
verifyAdminMiddleware()

// Visualizações amplas - CEO + Admin + Director
verifyAdminViewMiddleware()
```

### 2. Frontend - Rotas Protegidas (`frontend/src/components/ProtectedAdminRoute.tsx`)

```typescript
ProtectedCEORoute          // Apenas CEO
ProtectedFinanceiroRoute   // CEO + Financeiro
ProtectedAdminRoute        // CEO + Admin
ProtectedAdminViewRoute    // CEO + Admin + Director
```

### 3. Sidebar - Menu Dinâmico (`frontend/src/components/layout/Sidebar.tsx`)

O menu é filtrado automaticamente baseado no role do usuário:

```typescript
{ path: '/financeiro', label: 'Financeiro', roles: ['ceo', 'financeiro'] }
{ path: '/admin', label: 'Administração', roles: ['ceo', 'admin'] }
```

### 4. Dashboard - Seções Personalizadas (`frontend/src/features/dashboard/pages/DashboardPage.tsx`)

- **hasAdminAccess**: Mostra painel administrativo (CEO + Admin)
- **hasFinanceAccess**: Mostra painel financeiro (CEO + Financeiro)

## Páginas Criadas

### Área Financeira (`/financeiro`)
- ✅ Gestão de comissões (pendentes/pagas)
- ✅ Filtros por status e busca
- ✅ Estatísticas financeiras (4 cards KPI)
- ✅ Marcar comissões como pagas
- ✅ Exportar CSV
- ✅ Dark mode completo

### Área Administrativa (`/admin`)
- ✅ Dashboard com métricas gerais
- ✅ Gerenciamento de usuários
- ✅ Configurações do sistema
- ✅ Notificações
- ✅ Logs de atividades
- ✅ Logs de acessos
- ✅ Relatórios completos

## Migrations

### Migration 026 - Adicionar Role Financeiro

```sql
-- Remove constraint antiga
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Adiciona nova constraint com 'financeiro'
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (
  'ceo', 'financeiro', 'admin', 'director', 'executive',
  'prime_consultant', 'senior_consultant', 'master_consultant', 'consultant'
));
```

## Tabela de Permissões

| Recurso              | CEO | Financeiro | Admin | Consultant |
|---------------------|-----|------------|-------|------------|
| Dashboard           | ✅  | ✅         | ✅    | ✅         |
| Vendas              | ✅  | ✅         | ✅    | ✅         |
| Equipe              | ✅  | ✅         | ✅    | ✅         |
| Comissões Pessoais  | ✅  | ✅         | ✅    | ✅         |
| **Área Financeira** | ✅  | ✅         | ❌    | ❌         |
| Aprovar Pagamentos  | ✅  | ✅         | ❌    | ❌         |
| **Área Admin**      | ✅  | ❌         | ✅    | ❌         |
| Gerenciar Usuários  | ✅  | ❌         | ✅    | ❌         |
| Configurações       | ✅  | ❌         | ✅    | ❌         |
| Logs/Auditoria      | ✅  | ❌         | ✅    | ❌         |

## Fluxo de Verificação

```
1. Usuário faz login
   └─> Token JWT contém role do usuário

2. Frontend verifica role
   └─> Filtra menu do sidebar
   └─> Mostra/oculta seções do dashboard
   └─> Aplica ProtectedRoute nas rotas

3. Backend valida cada requisição
   └─> Middleware verifica role do token
   └─> Retorna 403 se não autorizado
   └─> Processa requisição se autorizado
```

## Exemplos de Uso

### Criar usuário Financeiro
```sql
UPDATE users 
SET role = 'financeiro' 
WHERE email = 'financeiro@empresa.com';
```

### Criar usuário Admin
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@empresa.com';
```

### Criar usuário CEO
```sql
UPDATE users 
SET role = 'ceo' 
WHERE email = 'ceo@empresa.com';
```

## Status da Implementação

✅ Migration 026 criada e executada
✅ Middlewares de permissão criados
✅ Rotas protegidas implementadas
✅ Sidebar dinâmico configurado
✅ Página Financeiro criada
✅ Dashboard com seções personalizadas
✅ Compilação backend OK
✅ Sistema de roles completo

## Próximos Passos

1. **Testar login com diferentes roles**
   - Login como CEO → Ver ambas as áreas
   - Login como Financeiro → Ver apenas financeiro
   - Login como Admin → Ver apenas admin

2. **Criar usuários de teste**
   ```sql
   -- Criar usuários para cada role
   UPDATE users SET role = 'ceo' WHERE id = '...';
   UPDATE users SET role = 'financeiro' WHERE id = '...';
   UPDATE users SET role = 'admin' WHERE id = '...';
   ```

3. **Validar permissões**
   - Tentar acessar /financeiro como admin (deve redirecionar)
   - Tentar acessar /admin como financeiro (deve redirecionar)
   - Verificar que CEO acessa tudo

## Observações Importantes

⚠️ **Segurança**: As permissões são validadas tanto no frontend (UX) quanto no backend (segurança real).

⚠️ **Role 'director'**: Mantido para visualizações amplas (relatórios) mas sem acesso às áreas exclusivas.

✅ **Dark Mode**: Todas as novas páginas suportam tema escuro.

✅ **Responsivo**: Layout adaptado para mobile, tablet e desktop.
