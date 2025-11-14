# 🚀 Deploy na VPS Hostinger com Docker

## 📋 Pré-requisitos na VPS

1. Docker instalado
2. Docker Compose instalado
3. Acesso SSH à VPS
4. Domínio apontado: `sales.sesfortal.com.br` → IP da VPS
5. Git instalado (para clonar o repositório)

---

## 🔧 Passo a Passo - Deploy Completo

### 1️⃣ Conectar na VPS via SSH

```bash
ssh root@seu-ip-vps
# ou
ssh usuario@seu-ip-vps
```

### 2️⃣ Clonar o Repositório

```bash
cd /var/www  # ou outro diretório de sua preferência
git clone https://github.com/saamuelsam/sales-gamification.git
cd sales-gamification
```

### 3️⃣ Configurar Variáveis de Ambiente

```bash
# Copiar template de produção
cp .env.production backend/.env

# Editar variáveis sensíveis
nano backend/.env
```

**Edite estas variáveis importantes:**

```env
# IMPORTANTE: Mudar senha do banco
DB_PASSWORD=SuaSenhaSeguraAqui123!@#

# IMPORTANTE: Gerar chaves JWT únicas
JWT_SECRET=sua_chave_super_secreta_min_32_caracteres_aqui
JWT_REFRESH_SECRET=outra_chave_secreta_diferente_aqui

# Email já configurado (conferir senha)
SMTP_PASS="Fortal2026@#"

# URLs (já configurado)
FRONTEND_URL=https://sales.sesfortal.com.br
```

**Para gerar JWT_SECRET no Linux:**
```bash
openssl rand -base64 32
```

**Atualizar DATABASE_URL com a nova senha:**
```env
DATABASE_URL=postgres://admin:SUA_NOVA_SENHA@sales_postgres:5432/sales_gamification
```

### 4️⃣ Configurar Nginx para SSL (HTTPS)

Primeiro, instale o Certbot:

```bash
# Instalar Certbot
apt update
apt install -y certbot python3-certbot-nginx

# Gerar certificado SSL (faça isso ANTES de subir o Docker)
certbot certonly --standalone -d sales.sesfortal.com.br
```

Agora edite o arquivo Nginx:

```bash
nano nginx/default.conf
```

Use esta configuração:

```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name sales.sesfortal.com.br;
    
    # Para renovação do Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirecionar todo tráfego para HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name sales.sesfortal.com.br;

    # Certificados SSL
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # Configurações SSL recomendadas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend
    location / {
        proxy_pass http://sales_frontend:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://sales_backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts para requisições longas
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }

    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Criar link simbólico dos certificados:

```bash
mkdir -p nginx/ssl
ln -s /etc/letsencrypt/live/sales.sesfortal.com.br/fullchain.pem nginx/ssl/fullchain.pem
ln -s /etc/letsencrypt/live/sales.sesfortal.com.br/privkey.pem nginx/ssl/privkey.pem
```

### 5️⃣ Construir e Subir os Containers

```bash
# Build das imagens
docker-compose -f docker-compose.production.yml build

# Subir os containers
docker-compose -f docker-compose.production.yml up -d

# Ver logs
docker-compose -f docker-compose.production.yml logs -f
```

### 6️⃣ Executar Migrations do Banco

```bash
# Entrar no container do backend
docker exec -it sales_backend sh

# Rodar migrations
npm run migrate

# Criar usuário admin (se necessário)
npm run seed

# Sair do container
exit
```

### 7️⃣ Verificar Status

```bash
# Ver containers rodando
docker ps

# Ver logs específicos
docker logs sales_backend
docker logs sales_frontend
docker logs sales_nginx
docker logs sales_postgres

# Ver logs em tempo real
docker-compose -f docker-compose.production.yml logs -f backend
```

---

## ✅ Testes Pós-Deploy

### 1. Verificar se o site está no ar
```bash
curl -I https://sales.sesfortal.com.br
```

Deve retornar: `HTTP/2 200`

### 2. Verificar API
```bash
curl https://sales.sesfortal.com.br/api/health
```

### 3. Criar conta de teste
1. Acesse: https://sales.sesfortal.com.br/register
2. Crie uma conta com seu email pessoal
3. Verifique se recebeu o email (cheque SPAM)
4. Clique no link de verificação
5. Faça login

---

## 🔄 Comandos Úteis

### Parar tudo
```bash
docker-compose -f docker-compose.production.yml down
```

### Reiniciar serviços
```bash
docker-compose -f docker-compose.production.yml restart
```

### Rebuild após mudanças no código
```bash
# Pull das mudanças
git pull origin main

# Rebuild e restart
docker-compose -f docker-compose.production.yml up -d --build
```

### Ver uso de recursos
```bash
docker stats
```

### Limpar volumes (CUIDADO: apaga dados)
```bash
docker-compose -f docker-compose.production.yml down -v
```

### Backup do banco de dados
```bash
docker exec sales_postgres pg_dump -U admin sales_gamification > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup
```bash
docker exec -i sales_postgres psql -U admin sales_gamification < backup_20250113_120000.sql
```

---

## 🔐 Renovação Automática de SSL

Configurar cron para renovar certificados:

```bash
# Editar crontab
crontab -e

# Adicionar linha (roda todo dia às 3h)
0 3 * * * certbot renew --quiet --post-hook "docker-compose -f /var/www/sales-gamification/docker-compose.production.yml restart nginx"
```

---

## 🚨 Troubleshooting

### Containers não sobem
```bash
# Ver erro específico
docker-compose -f docker-compose.production.yml logs backend

# Verificar portas em uso
netstat -tulpn | grep LISTEN
```

### Email não funciona
```bash
# Verificar variáveis
docker exec sales_backend env | grep SMTP

# Testar conexão SMTP
docker exec sales_backend node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'fortalengenhariasolar@sesfortal.com.br',
    pass: 'Fortal2026@#'
  }
});
transporter.verify().then(() => console.log('✅ SMTP OK')).catch(err => console.error('❌ Erro:', err));
"
```

### Banco não conecta
```bash
# Verificar se PostgreSQL está rodando
docker exec sales_postgres psql -U admin -d sales_gamification -c "SELECT version();"

# Ver logs do PostgreSQL
docker logs sales_postgres
```

### Nginx não serve HTTPS
```bash
# Verificar certificados
ls -la /etc/letsencrypt/live/sales.sesfortal.com.br/

# Testar configuração Nginx
docker exec sales_nginx nginx -t

# Recarregar Nginx
docker exec sales_nginx nginx -s reload
```

---

## 📊 Monitoramento

### Logs em tempo real
```bash
# Todos os serviços
docker-compose -f docker-compose.production.yml logs -f

# Apenas backend
docker-compose -f docker-compose.production.yml logs -f backend

# Últimas 100 linhas
docker-compose -f docker-compose.production.yml logs --tail=100 backend
```

### Recursos do sistema
```bash
# Uso de CPU/Memória
docker stats --no-stream

# Espaço em disco
df -h
docker system df
```

---

## 🎯 Checklist Final

- [ ] Domínio aponta para IP da VPS
- [ ] SSH conectando na VPS
- [ ] Repositório clonado
- [ ] `.env` configurado com senhas fortes
- [ ] JWT_SECRET gerado e configurado
- [ ] Certificado SSL gerado
- [ ] Nginx configurado para HTTPS
- [ ] Containers rodando (`docker ps`)
- [ ] Migrations executadas
- [ ] Site acessível via HTTPS
- [ ] API respondendo (`/api/health`)
- [ ] Email de verificação funcionando
- [ ] Teste de login funcionando
- [ ] Backup configurado
- [ ] Renovação SSL automática configurada

---

## 🚀 Pronto para Produção!

Depois de seguir todos os passos:

✅ Sistema rodando em: https://sales.sesfortal.com.br
✅ Emails funcionando via Hostinger
✅ SSL/HTTPS ativo
✅ Backup configurado
✅ Monitoramento ativo

**Qualquer dúvida, verifique os logs!**
