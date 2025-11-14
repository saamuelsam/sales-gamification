# ✅ Checklist de Deploy - Sistema de Verificação de Email

## 📋 Antes de Fazer Deploy para Produção

### 1. ⚙️ Variáveis de Ambiente (CRÍTICO)

No seu arquivo `.env` de produção ou nas variáveis de ambiente do Render/servidor, você **DEVE** configurar:

```env
# Ambiente
NODE_ENV=production

# Email Configuration (OBRIGATÓRIO)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=seu_email@seudominio.com
SMTP_PASS=sua_senha_smtp
SMTP_FROM_EMAIL=noreply@seudominio.com
SMTP_FROM_NAME=Fortal Energia Solar

# Frontend URL (para links nos emails)
FRONTEND_URL=https://seu-dominio.com

# NÃO usar DISABLE_EMAILS=true em produção!
# (remova essa variável ou deixe como false)
```

### 2. 📧 Configuração de Email

#### Opção A: Hostinger (Já configurado no código)
- Acesse o painel do Hostinger
- Crie um email: `noreply@seudominio.com`
- Anote usuário e senha
- Configure as variáveis acima

#### Opção B: Gmail
Se preferir usar Gmail:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASS=senha_de_aplicativo  # NÃO use a senha normal!
```

**Para Gmail:**
1. Ative verificação em 2 etapas
2. Gere uma "Senha de App": https://myaccount.google.com/apppasswords
3. Use essa senha nas variáveis de ambiente

#### Opção C: SendGrid (Recomendado para produção)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.sua_api_key_aqui
```

### 3. 🧪 Teste Antes do Deploy

Execute este script de teste local:

```bash
# No backend
cd backend
npm run test:email
```

Se não tiver script de teste, crie um arquivo `test_email_production.ts`:

```typescript
import { emailService } from './src/services/email.service';

async function testEmail() {
  console.log('🧪 Testando envio de email...');
  
  try {
    await emailService.sendWelcomeEmail(
      'seu_email_pessoal@gmail.com',
      'Teste',
      'token_de_teste_123'
    );
    console.log('✅ Email enviado com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testEmail();
```

### 4. 🔍 Verificações Finais

- [ ] `NODE_ENV=production` configurado
- [ ] `DISABLE_EMAILS` **NÃO** está definido ou está como `false`
- [ ] Credenciais SMTP válidas e testadas
- [ ] `FRONTEND_URL` aponta para o domínio de produção correto
- [ ] Testou envio de email localmente com credenciais de produção
- [ ] Email de verificação está sendo enviado corretamente
- [ ] Links nos emails apontam para o domínio correto

### 5. 🚨 Problemas Comuns e Soluções

#### Emails não chegam
- ✅ Verifique spam/lixeira
- ✅ Confirme que `NODE_ENV=production`
- ✅ Verifique logs do servidor: `console.log('📧 [EMAIL DESABILITADO]')` não deve aparecer
- ✅ Teste credenciais SMTP em ferramenta online: https://www.smtper.net/

#### Emails vão para spam
- ✅ Configure SPF record no DNS: `v=spf1 include:_spf.hostinger.com ~all`
- ✅ Configure DKIM no painel do Hostinger
- ✅ Use um domínio próprio, não email gratuito

#### Erro de autenticação SMTP
- ✅ Senha correta? (sem espaços extras)
- ✅ Para Gmail: usando senha de app, não senha normal?
- ✅ Servidor permite conexões SMTP? (alguns hosts bloqueiam)

### 6. 🎯 Fluxo de Verificação em Produção

1. **Usuário se registra**
   ```
   POST /api/auth/register
   → Cria conta com email_verified=false
   → Gera token de verificação
   → Envia email com link
   ```

2. **Usuário recebe email**
   ```
   Para: usuario@email.com
   Link: https://seu-dominio.com/verify-email?token=abc123
   ```

3. **Usuário clica no link**
   ```
   GET https://seu-dominio.com/verify-email?token=abc123
   → Frontend chama: GET /api/auth/verify-email?token=abc123
   → Backend marca email_verified=true
   → Redireciona para login
   ```

4. **Usuário faz login**
   ```
   POST /api/auth/login
   → Verifica email_verified=true ✅
   → Retorna token JWT
   → Acessa o sistema
   ```

### 7. 📱 Opção: Bypass Temporário (NÃO RECOMENDADO)

Se por algum motivo precisar desabilitar verificação temporariamente:

**backend/src/modules/auth/auth.service.ts** (linha ~119)
```typescript
// TEMPORÁRIO: Comentar verificação de email
// if (!user.email_verified) {
//   throw new Error('Por favor, verifique seu email antes de fazer login.');
// }
```

⚠️ **ATENÇÃO**: Isso permite login sem verificar email. Use apenas para testes!

### 8. 🔧 Monitoramento em Produção

Adicione logs para monitorar:

```typescript
// backend/src/services/email.service.ts
console.log('📧 Enviando email:', { to, subject, NODE_ENV: process.env.NODE_ENV });
```

Use ferramentas como:
- Render Logs
- Sentry para erros
- Logtail para logs estruturados

---

## ✨ Resumo: O que muda em Produção?

### Desenvolvimento (agora)
```env
NODE_ENV=development
DISABLE_EMAILS=true
```
→ Emails **não são enviados** (apenas log no console)
→ Verificação manual via SQL

### Produção (após deploy)
```env
NODE_ENV=production
# DISABLE_EMAILS não definido
SMTP_HOST=smtp.hostinger.com
SMTP_USER=noreply@seudominio.com
SMTP_PASS=senha_real
```
→ Emails **são enviados automaticamente**
→ Verificação acontece pelo link no email

---

## 🚀 Deploy Seguro

1. Configure variáveis de ambiente no Render
2. Faça o deploy
3. Crie uma conta de teste
4. Verifique se o email chegou
5. Clique no link de verificação
6. Confirme que consegue fazer login
7. ✅ Deploy completo!

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique logs do servidor
2. Teste credenciais SMTP em: https://www.smtper.net/
3. Confirme que `NODE_ENV=production`
4. Verifique se email não foi para spam

**Dica**: Sempre teste com um email pessoal primeiro antes de liberar para usuários!
