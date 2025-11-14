# 🚀 Configuração de Produção - Render

## 📋 Variáveis de Ambiente para Configurar no Render

### Backend (sales-gamification-backend ou similar)

Acesse o painel do Render → Seu serviço Backend → Environment

Adicione/edite estas variáveis:

```env
# Ambiente
NODE_ENV=production

# URLs
FRONTEND_URL=https://sales.sesfortal.com.br

# Email - Hostinger
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=fortalengenhariasolar@sesfortal.com.br
SMTP_PASS=SUA_SENHA_DO_EMAIL_AQUI
SMTP_FROM_EMAIL=fortalengenhariasolar@sesfortal.com.br
SMTP_FROM_NAME=Fortal Energia Solar

# JWT (gere uma chave segura)
JWT_SECRET=sua_chave_secreta_jwt_aqui_min_32_caracteres

# Database (já deve estar configurado)
DATABASE_URL=postgresql://usuario:senha@host:5432/database
```

### ⚠️ IMPORTANTE: 
**NÃO adicione a variável `DISABLE_EMAILS`** - ela deve estar ausente ou como `false`

---

## 🔑 Como Configurar no Render

### Passo 1: Acesse o Backend
1. Vá em https://dashboard.render.com/
2. Clique no seu serviço de **Backend**
3. Vá na aba **"Environment"**

### Passo 2: Adicione as Variáveis
Para cada variável acima:
1. Clique em **"Add Environment Variable"**
2. **Key**: Nome da variável (ex: `SMTP_USER`)
3. **Value**: Valor da variável (ex: `fortalengenhariasolar@sesfortal.com.br`)
4. Clique em **"Save"**

### Passo 3: Senha do Email
Para `SMTP_PASS`:
1. Acesse o painel do Hostinger: https://hpanel.hostinger.com/
2. Vá em **"Emails"**
3. Encontre o email: `fortalengenhariasolar@sesfortal.com.br`
4. Se não lembrar a senha, clique em **"Gerenciar"** → **"Alterar Senha"**
5. Defina uma senha forte e **anote**
6. Cole essa senha no valor de `SMTP_PASS` no Render

### Passo 4: JWT Secret (Segurança)
Gere uma chave aleatória segura. Você pode usar:

**Opção A - No PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Opção B - Online:**
https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")

Cole o resultado em `JWT_SECRET`

---

## ✅ Checklist de Configuração

- [ ] `NODE_ENV=production` ✓
- [ ] `FRONTEND_URL=https://sales.sesfortal.com.br` ✓
- [ ] `SMTP_HOST=smtp.hostinger.com` ✓
- [ ] `SMTP_PORT=465` ✓
- [ ] `SMTP_SECURE=true` ✓
- [ ] `SMTP_USER=fortalengenhariasolar@sesfortal.com.br` ✓
- [ ] `SMTP_PASS=senha_do_email` ⚠️ (você precisa adicionar)
- [ ] `SMTP_FROM_EMAIL=fortalengenhariasolar@sesfortal.com.br` ✓
- [ ] `SMTP_FROM_NAME=Fortal Energia Solar` ✓
- [ ] `JWT_SECRET` com mínimo 32 caracteres ⚠️ (gere uma)
- [ ] `DATABASE_URL` configurado ✓ (já deve ter)
- [ ] **Confirmar que NÃO tem `DISABLE_EMAILS=true`** ⚠️

---

## 🧪 Testar Após Deploy

### 1. Criar Conta de Teste
1. Acesse https://sales.sesfortal.com.br/register
2. Crie uma conta com **seu email pessoal**
3. Aguarde receber o email

### 2. Verificar Email
- Cheque sua caixa de entrada
- **Importante**: Verifique a pasta de SPAM também
- O email virá de: `fortalengenhariasolar@sesfortal.com.br`
- Assunto: "Bem-vindo à Fortal Energia Solar - Verifique seu Email"

### 3. Clicar no Link
- Clique no botão "Verificar Email" no email
- Você será redirecionado para: `https://sales.sesfortal.com.br/verify-email?token=...`
- Deve aparecer mensagem de sucesso

### 4. Fazer Login
- Acesse https://sales.sesfortal.com.br/login
- Entre com suas credenciais
- Deve funcionar! ✅

---

## 🚨 Problemas Comuns

### Email não chega
**Verifique:**
1. Logs do Render (aba "Logs" do seu backend)
   - Procure por: `📧 Enviando email` ou `❌ Erro ao enviar email`
2. Se aparecer `📧 [EMAIL DESABILITADO]` → `NODE_ENV` não está como `production`
3. Teste credenciais SMTP em: https://www.smtper.net/

### Email vai para SPAM
**Soluções:**
1. Configure SPF no DNS:
   - Acesse o painel do Hostinger → DNS/Nameservers
   - Adicione registro TXT: `v=spf1 include:_spf.hostinger.com ~all`
2. Ative DKIM no painel de emails do Hostinger
3. Aguarde 24-48h para propagação DNS

### Erro 401 ao fazer login
- Email não foi verificado
- Use o botão "Reenviar" na página de login
- Ou verifique manualmente via banco de dados (como fizemos)

---

## 📞 Comandos Úteis

### Ver logs em tempo real (Render)
No painel do Render → Seu Backend → Aba "Logs"

### Testar email localmente (opcional)
```bash
cd backend
npm run test:email
```

### Verificar variáveis configuradas
No Render → Environment → Você verá todas as variáveis (senhas ficam ocultas)

---

## 🎯 Resumo Rápido

**O que você precisa fazer agora:**

1. ✅ Acesse o Render Dashboard
2. ✅ Vá no seu serviço de Backend
3. ✅ Aba "Environment"
4. ✅ Adicione todas as variáveis acima
5. ✅ **Especialmente**: `SMTP_PASS` com a senha do email Hostinger
6. ✅ Gere e adicione um `JWT_SECRET` forte
7. ✅ Salve e aguarde o redeploy automático
8. ✅ Teste criando uma conta com seu email pessoal
9. ✅ Verifique se o email chegou
10. ✅ Clique no link e faça login

**Pronto! Sistema 100% funcional em produção!** 🚀
