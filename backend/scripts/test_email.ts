/**
 * Script para testar envio de email via SMTP Hostinger
 * 
 * Para executar:
 * npm run test-email
 */

import { emailService } from '../src/services/email.service';

async function testEmail() {
  console.log('🧪 Iniciando teste de envio de email...\n');

  try {
    // 1. Teste de email simples
    console.log('1️⃣ Enviando email de teste simples...');
    await emailService.sendEmail({
      to: 'seu-email-para-teste@gmail.com', // ⚠️ ALTERE AQUI
      subject: '🧪 Teste SMTP Hostinger',
      html: `
        <h1>Email de Teste</h1>
        <p>Se você está lendo isso, o SMTP Hostinger está funcionando! ✅</p>
        <p>Data/Hora: ${new Date().toLocaleString('pt-BR')}</p>
      `,
    });
    console.log('✅ Email simples enviado com sucesso!\n');

    // 2. Teste de email de boas-vindas
    console.log('2️⃣ Enviando email de boas-vindas...');
    await emailService.sendWelcomeEmail(
      'seu-email-para-teste@gmail.com', // ⚠️ ALTERE AQUI
      'Teste Usuario',
      'token_fake_123456'
    );
    console.log('✅ Email de boas-vindas enviado com sucesso!\n');

    // 3. Teste de email de redefinição de senha
    console.log('3️⃣ Enviando email de redefinição de senha...');
    await emailService.sendPasswordResetEmail(
      'seu-email-para-teste@gmail.com', // ⚠️ ALTERE AQUI
      'Teste Usuario',
      'reset_token_fake_789'
    );
    console.log('✅ Email de redefinição enviado com sucesso!\n');

    // 4. Teste de email de venda
    console.log('4️⃣ Enviando email de notificação de venda...');
    await emailService.sendSaleNotification(
      'seu-email-para-teste@gmail.com', // ⚠️ ALTERE AQUI
      'Teste Usuario',
      15000,
      150
    );
    console.log('✅ Email de venda enviado com sucesso!\n');

    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ SMTP Hostinger configurado corretamente!\n');
    console.log('📧 Verifique sua caixa de entrada (e spam) do email de teste.');

  } catch (error: any) {
    console.error('\n❌ ERRO AO ENVIAR EMAIL:', error);
    console.error('\n🔍 Detalhes do erro:');
    console.error('- Mensagem:', error.message);
    console.error('- Código:', error.code);
    
    if (error.code === 'EAUTH') {
      console.error('\n⚠️ ERRO DE AUTENTICAÇÃO!');
      console.error('Verifique:');
      console.error('1. SMTP_USER está correto (email completo)');
      console.error('2. SMTP_PASS está correto');
      console.error('3. Email existe na conta Hostinger');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('\n⚠️ ERRO DE CONEXÃO!');
      console.error('Verifique:');
      console.error('1. SMTP_HOST está correto (smtp.hostinger.com)');
      console.error('2. SMTP_PORT está correto (465 ou 587)');
      console.error('3. Firewall não está bloqueando');
    }
  }

  process.exit(0);
}

// Executar teste
testEmail();
