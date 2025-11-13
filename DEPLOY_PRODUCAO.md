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
SENDGRID_API_KEY=SUA_API_KEY_DO_SENDGRID
SENDGRID_FROM_EMAIL=email-verificado@sesfortal.com.br
SENDGRID_FROM_NAME=Fortal Sales Gamification
```

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
```

### 4. **Gerar Keys Seguras (JWT):**

Execute no servidor para gerar keys aleatórias:

```bash
# Gerar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Gerar JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. **Checklist de Deploy:**

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
