# 🎁 Guia Completo - Sistema de Benefícios

## 📋 O que foi implementado

### ✅ Backend
1. **Rota de Benefits registrada** em `app.ts`
2. **Controller completo** com todos os endpoints
3. **Service** com lógica de negócio
4. **Seed com 30+ benefícios reais** distribuídos por 5 níveis

### ✅ Frontend
1. **Página redesenhada** com interface profissional
2. **Filtros** por categoria e nível
3. **Cards visuais** com imagens e badges
4. **Estatísticas** em tempo real
5. **Responsivo** para mobile/tablet/desktop
6. **Dark mode** completo

---

## 🚀 Como Iniciar o Sistema

### 1️⃣ **Iniciar Docker Desktop**
- Abra o Docker Desktop manualmente no Windows
- Aguarde até aparecer "Docker is running"

### 2️⃣ **Iniciar PostgreSQL**
```powershell
cd d:\Documentos\sales-gamification
docker-compose up -d postgres
```

### 3️⃣ **Verificar se PostgreSQL está rodando**
```powershell
docker ps
```
Deve aparecer: `postgres:15-alpine` com status `Up`

### 4️⃣ **Executar Migrations (se necessário)**
```powershell
cd backend
npm run migrate
```

### 5️⃣ **Executar Seeds de Benefícios**
```powershell
cd backend
npm run seed
```

OU executar direto pelo PostgreSQL:
```powershell
# Conectar ao container
docker exec -it <container_id> psql -U admin -d sales_gamification

# Executar seed
\i /path/to/003_insert_benefits.sql
```

**OU usar script manual:**
```powershell
# No PowerShell, na pasta backend
$env:PGPASSWORD='admin123'
Get-Content src/database/seeds/003_insert_benefits.sql | docker exec -i sales-gamification-postgres-1 psql -U admin -d sales_gamification
```

### 6️⃣ **Iniciar Backend**
```powershell
cd d:\Documentos\sales-gamification\backend
npx tsx -r tsconfig-paths/register src/server.ts
```

Deve aparecer:
```
🚀 Server running on port 4000
✅ Database connected successfully
```

### 7️⃣ **Verificar Frontend**
O frontend já deve estar rodando em: `http://localhost:5173`

Se não estiver:
```powershell
cd d:\Documentos\sales-gamification\frontend
npm run dev
```

---

## 🧪 Testar o Sistema

### 1. **Verificar Benefícios no Banco**
```sql
-- Conectar ao PostgreSQL
docker exec -it sales-gamification-postgres-1 psql -U admin -d sales_gamification

-- Ver todos os benefícios
SELECT 
  l.name as nivel,
  COUNT(b.id) as total_beneficios
FROM levels l
LEFT JOIN benefits b ON b.level_id = l.id
GROUP BY l.id, l.name
ORDER BY l.phase_number;

-- Ver detalhes de um nível
SELECT b.title, b.category, b.period 
FROM benefits b
JOIN levels l ON b.level_id = l.id
WHERE l.name = 'Executivo';
```

### 2. **Testar API**
```powershell
# Obter token (fazer login primeiro)
$token = "seu_token_aqui"

# Testar endpoint de benefícios do usuário
curl http://localhost:4000/api/benefits/user `
  -H "Authorization: Bearer $token"
```

### 3. **Acessar Interface**
1. Abrir `http://localhost:5173`
2. Fazer login
3. Acessar aba "Benefícios" no menu
4. Testar filtros de categoria e nível

---

## 📊 Estrutura dos Benefícios

### 🔸 Nível 1: Consultor Elite
- Kit Inicial de Consultor
- Cesta Básica Mensal

### 🔸 Nível 2: Master
- Bônus R$ 1.000
- Jantar com Acompanhante
- Troféu Master

### 🔸 Nível 3: Consultor Sênior
- Ajuda de Custo R$ 1.518/mês
- Bônus R$ 1.500
- Jantar no Ilamare
- Notebook Profissional
- Troféu Sênior

### 🔸 Nível 4: Consultor Prime
- Ajuda de Custo R$ 1.518/mês
- Bônus R$ 1.500
- Jantar Premium Ilamare
- Smartphone Top de Linha
- Viagem para Duas Pessoas
- Troféu Prime

### 🔸 Nível 5: Executivo
- Ajuda de Custo R$ 1.518→5.000/mês
- Bônus R$ 10.000
- Fim de Semana em Balneário Camboriú
- Carro 0km
- MacBook Pro
- Troféu de Cristal
- Viagem Internacional Anual

---

## 🎨 Categorias de Benefícios

| Categoria | Ícone | Cor | Exemplos |
|-----------|-------|-----|----------|
| **Kit** | 📦 | Azul | Kit Inicial |
| **Eletrônicos** | 💻 | Roxo | Notebook, Smartphone, MacBook |
| **Jantares** | 🍽️ | Laranja | Jantar Premium, Ilamare |
| **Viagens** | ✈️ | Ciano | Resort, Internacional |
| **Troféus** | 🏆 | Amarelo | Troféus de Reconhecimento |
| **Veículos** | 🚗 | Vermelho | Carro 0km |
| **Financeiro** | 💰 | Verde | Bônus, Ajuda de Custo |

---

## 🔧 Troubleshooting

### ❌ Erro: "Rota não encontrada /benefits/user"
**Solução:** Verifique se o backend foi reiniciado após adicionar a rota em `app.ts`

### ❌ Erro: "ECONNREFUSED 5432"
**Solução:** Docker não está rodando. Inicie o Docker Desktop e execute `docker-compose up -d postgres`

### ❌ Benefícios não aparecem na tela
**Solução:** 
1. Verifique se o seed foi executado: `SELECT COUNT(*) FROM benefits;`
2. Verifique se o usuário tem nível atribuído
3. Verifique console do navegador para erros de API

### ❌ Imagens não carregam
**Solução:** As imagens são do Unsplash. Verifique conexão com internet. As imagens têm fallback com ícones.

---

## 📝 Endpoints Disponíveis

```
GET  /api/benefits/           - Lista todos os benefícios
GET  /api/benefits/user/:id?  - Benefícios desbloqueados do usuário (usa token se sem ID)
GET  /api/benefits/level/:id  - Benefícios de um nível específico
POST /api/benefits/           - Criar benefício (admin)
PUT  /api/benefits/:id        - Atualizar benefício (admin)
DEL  /api/benefits/:id        - Remover benefício (admin)
```

---

## 🎯 Próximos Passos Sugeridos

1. **Adicionar animações** de conquista quando desbloquear benefício
2. **Notificações push** quando ganhar novo benefício
3. **Timeline** de benefícios conquistados
4. **Share social** - compartilhar conquistas
5. **PDF** - certificado de benefícios
6. **Admin panel** - gerenciar benefícios via interface

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique logs do backend: Terminal onde rodou `npx tsx`
2. Verifique console do navegador (F12)
3. Verifique se Docker está rodando
4. Verifique se migrations foram executadas

---

**Desenvolvido por:** Sales Gamification System  
**Data:** 12/11/2025  
**Versão:** 1.0.0
