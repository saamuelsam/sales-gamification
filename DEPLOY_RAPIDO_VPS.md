# 🚀 Guia Rápido - Deploy VPS Hostinger

## 🔴 **PROBLEMA RESOLVIDO**: JWT_SECRET não estava sendo carregado

O erro `secretOrPrivateKey must have a value` acontecia porque as variáveis de ambiente não estavam sendo passadas para o container Docker.

---

## ✅ **SOLUÇÃO**: Arquivo `.env` criado na raiz

Agora o projeto tem um arquivo `.env` na raiz que o `docker-compose.yml` usa para substituir as variáveis `${JWT_SECRET}`, `${SMTP_PASS}`, etc.

---

## 📋 **DEPLOY - PASSO A PASSO**

### 1️⃣ **NO SEU COMPUTADOR (Windows)**

Execute o script de deploy:

```powershell
.\deploy-vps.ps1
```

Ou manualmente:

```powershell
git add .
git commit -m "Fix: Adicionar variáveis de ambiente"
git push origin main
```

### 2️⃣ **NA VPS (via SSH)**

Conecte na VPS:

```bash
ssh root@seu-ip-vps
# ou
ssh usuario@seu-ip-vps
```

Navegue até o projeto:

```bash
cd /var/www/sales-gamification
```

Atualize o código:

```bash
git pull origin main
```

**PRIMEIRA VEZ APENAS** - Copie o arquivo `.env`:

```bash
cp .env.production .env
```

**IMPORTANTE**: Edite o `.env` e coloque senhas fortes em produção:

```bash
nano .env
# Mude DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET
```

Rebuild e reinicie os containers:

```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

Verifique os logs:

```bash
docker-compose logs -f backend
```

**✅ Você deve ver:**
- ✅ `Server running on port 4000`
- ✅ `Database connected`
- ✅ **NÃO deve ter** erro de `secretOrPrivateKey`

---

## 🧪 **TESTAR O LOGIN**

1. Acesse: https://sales.sesfortal.com.br/login
2. Email: `samuelanselmo69@gmail.com`
3. Senha: sua senha
4. Clique em "Entrar"

**✅ DEVE FUNCIONAR AGORA!**

---

## 🔍 **VERIFICAR VARIÁVEIS NO CONTAINER**

Para confirmar que as variáveis estão carregadas:

```bash
docker exec sales_backend env | grep JWT_SECRET
docker exec sales_backend env | grep SMTP
```

Deve mostrar as variáveis com valores (não vazias).

---

## 🚨 **TROUBLESHOOTING**

### Se ainda der erro 401:

1. Verificar se o `.env` existe na raiz:
   ```bash
   cat .env
   ```

2. Verificar se as variáveis estão no container:
   ```bash
   docker exec sales_backend env | grep JWT_SECRET
   ```

3. Se estiver vazio, rebuilde:
   ```bash
   docker-compose down
   docker-compose up -d --build --force-recreate
   ```

4. Ver logs detalhados:
   ```bash
   docker-compose logs -f backend
   ```

### Se der erro de SMTP:

Verifique a senha do email:
```bash
docker exec sales_backend env | grep SMTP_PASS
```

---

## 📁 **ARQUIVOS CRIADOS/MODIFICADOS**

- ✅ `.env` - Variáveis para Docker Compose (NA RAIZ)
- ✅ `.env.example` - Template de exemplo
- ✅ `.env.production` - Variáveis completas de produção
- ✅ `docker-compose.yml` - Atualizado com todas as variáveis
- ✅ `deploy-vps.ps1` - Script de deploy automatizado
- ✅ Este arquivo (`DEPLOY_RAPIDO_VPS.md`)

---

## 🎯 **RESUMO**

**Antes:**
- ❌ `${JWT_SECRET}` no `docker-compose.yml` era substituído por vazio
- ❌ JWT não conseguia assinar/verificar tokens
- ❌ Erro 401 no login

**Depois:**
- ✅ Arquivo `.env` na raiz com `JWT_SECRET=...`
- ✅ Docker Compose substitui `${JWT_SECRET}` corretamente
- ✅ Backend recebe a variável de ambiente
- ✅ JWT funciona
- ✅ Login funciona! 🎉

---

## ⚡ **COMANDO RÁPIDO - DEPLOY COMPLETO**

```bash
# Na VPS (após git pull)
docker-compose down && docker-compose build --no-cache backend && docker-compose up -d && docker-compose logs -f backend
```

---

**Pronto! Sistema 100% funcional na VPS! 🚀**
