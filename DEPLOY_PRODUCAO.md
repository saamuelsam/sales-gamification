# 🚀 Configuração de Produção

## Variáveis de Ambiente que Precisam ser Alteradas no Servidor

### 1. **Backend `.env` (Criar no servidor)**

Ao fazer deploy, crie o arquivo `backend/.env` no servidor com:

```bash
# Server
NODE_ENV=production
PORT=4000

# Database PostgreSQL (usar service names do docker-compose)
DB_HOST=sales_postgres
DB_PORT=5432
DB_NAME=sales_gamification
DB_USER=admin
DB_PASSWORD=SUA_SENHA_SEGURA_AQUI

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT (GERAR NOVAS KEYS SEGURAS!)
JWT_SECRET=GERAR_KEY_SEGURA_AQUI
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=GERAR_OUTRA_KEY_SEGURA
JWT_REFRESH_EXPIRES_IN=30d

# App
BCRYPT_ROUNDS=10

# Database URL
DATABASE_URL=postgres://admin:SUA_SENHA_SEGURA_AQUI@sales_postgres:5432/sales_gamification

# Frontend URL
FRONTEND_URL=https://sales.sesfortal.com.br

# SendGrid Email (CONFIGURAR COM EMAIL VERIFICADO)
SENDGRID_API_KEY=SG.XXXXXXXXXXXXXXXXXXXXXXXX  # Deve começar com "SG."
SENDGRID_FROM_EMAIL=email-verificado@sesfortal.com.br
SENDGRID_FROM_NAME=Fortal Sales Gamification
```

> ⚠️ **IMPORTANTE sobre SendGrid:**
> - A API Key DEVE começar com `SG.`
> - O email em `SENDGRID_FROM_EMAIL` DEVE estar verificado no SendGrid
> - Acesse https://app.sendgrid.com/settings/sender_auth para verificar o email
> - Se não tiver domínio verificado, pode usar o email Gmail verificado: `contactsamans@gmail.com`

### 2. **Docker Compose - Alterar no Servidor**

No `docker-compose.yml` do servidor, altere:

```yaml
  postgres:
    environment:
      POSTGRES_PASSWORD: SUA_SENHA_SEGURA_AQUI  # Mesma do .env

  backend:
    environment:
      NODE_ENV: production  # Mudar para production
    command: npm start  # Usar build de produção, não dev
```

### 3. **Comando para Deploy:**

```bash
# 1. No servidor, clone o repo
git pull origin main

# 2. Crie o arquivo .env no backend (copie o conteúdo acima)
nano backend/.env

# 3. Edite docker-compose.yml com as senhas corretas
nano docker-compose.yml

# 4. Rebuild e restart
docker-compose down
docker-compose build
docker-compose up -d

# 5. Execute migrations
docker exec sales_backend npm run migrate

# 6. Verifique os logs
docker logs sales_backend
docker logs sales_frontend
docker logs sales_nginx

# 7. Teste o health check
curl http://localhost/health
```

### 4. **Verificar Containers:**

```bash
# Ver status dos containers
docker ps

# Ver logs em tempo real
docker logs -f sales_backend
docker logs -f sales_frontend
docker logs -f sales_nginx

# Restart individual se necessário
docker restart sales_backend
docker restart sales_frontend
docker restart sales_nginx
```

### 5. **Gerar Keys Seguras (JWT):**

Execute no servidor para gerar keys aleatórias:

```bash
# Gerar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Gerar JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 6. **Checklist de Deploy:**

- [ ] `.env` criado com valores corretos
- [ ] Senhas do PostgreSQL alteradas
- [ ] JWT secrets gerados
- [ ] SendGrid configurado com email verificado
- [ ] `NODE_ENV=production` no docker-compose
- [ ] `FRONTEND_URL` apontando para domínio correto
- [ ] Migrations executadas
- [ ] Firewall liberado para portas necessárias

### 6. **Segurança:**

⚠️ **NUNCA commite:**
- `backend/.env` (ignorado pelo .gitignore)
- Senhas reais no docker-compose.yml
- API keys no código

✅ **SEMPRE use:**
- `.env.example` como template
- Senhas fortes e únicas
- HTTPS em produção
- Backups regulares do banco

---

## 7. 🔧 Troubleshooting - Erros Comuns

### ❌ Erro 502 Bad Gateway

**Causa:** Backend não está respondendo ou Nginx mal configurado.

**Solução:**
```bash
# 1. Verificar se backend está rodando
docker ps | grep backend

# 2. Ver logs do backend
docker logs sales_backend --tail 50

# 3. Verificar se porta 4000 está acessível
docker exec sales_backend curl http://localhost:4000/health

# 4. Restart do Nginx
docker restart sales_nginx

# 5. Se persistir, rebuild completo
docker-compose down
docker-compose up -d --build
```

### ❌ "API key does not start with SG."

**Causa:** SendGrid API Key inválida ou ausente.

**Solução:**
```bash
# 1. Verificar se a key está no .env
docker exec sales_backend cat /app/.env | grep SENDGRID

# 2. A key DEVE começar com "SG."
# Exemplo correto: SG.abc123...

# 3. Se não tiver SendGrid configurado, pode comentar temporariamente
# Edite backend/.env e adicione:
SENDGRID_API_KEY=

# 4. Restart do backend
docker restart sales_backend
```

### ❌ Rota não encontrada: GET /

**Causa:** Nginx não está encaminhando corretamente para o frontend.

**Solução:**
```bash
# 1. Verificar se frontend está rodando
docker ps | grep frontend
docker logs sales_frontend --tail 20

# 2. Verificar configuração do Nginx
docker exec sales_nginx cat /etc/nginx/conf.d/default.conf

# 3. Testar acesso direto ao frontend
docker exec sales_nginx curl http://frontend:80

# 4. Restart do Nginx após qualquer alteração
docker restart sales_nginx
```

### ❌ Migrations falhando

**Causa:** Banco não está pronto ou credenciais incorretas.

**Solução:**
```bash
# 1. Verificar se PostgreSQL está rodando
docker ps | grep postgres

# 2. Testar conexão
docker exec sales_backend npm run db:check

# 3. Ver logs do PostgreSQL
docker logs sales_postgres --tail 50

# 4. Executar migrations manualmente
docker exec sales_backend npm run migrate

# 5. Se falhar, verificar credenciais no .env
docker exec sales_backend env | grep DB_
```

### ✅ Comando para verificar tudo de uma vez

```bash
echo "=== STATUS DOS CONTAINERS ==="
docker ps

echo -e "\n=== LOGS BACKEND (últimas 20 linhas) ==="
docker logs sales_backend --tail 20

echo -e "\n=== LOGS FRONTEND (últimas 10 linhas) ==="
docker logs sales_frontend --tail 10

echo -e "\n=== LOGS NGINX (últimas 10 linhas) ==="
docker logs sales_nginx --tail 10

echo -e "\n=== TESTE DE CONECTIVIDADE ==="
curl -I http://localhost/health
curl -I http://localhost/api/health
```
