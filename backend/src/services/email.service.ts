import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter;

  constructor() {
    // Configuração SMTP Hostinger
    console.log('🔧 Configurando SMTP:', {
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_SECURE,
      user: ENV.SMTP_USER,
      hasPassword: !!ENV.SMTP_PASS,
      passwordLength: ENV.SMTP_PASS?.length || 0
    });

    this.transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_SECURE, // true para 465, false para outros
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log('✅ Servidor SMTP configurado');
    
    // Nota: Verificação SMTP removida para evitar travamento na inicialização
    // A conexão será testada quando o primeiro email for enviado
  }

  async sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
    // 🚫 DESABILITAR EMAILS EM DESENVOLVIMENTO (evitar travamento)
    if (process.env.NODE_ENV === 'development' || process.env.DISABLE_EMAILS === 'true') {
      console.log('📧 [EMAIL DESABILITADO] Para:', to, '| Assunto:', subject);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${ENV.SMTP_FROM_NAME}" <${ENV.SMTP_FROM_EMAIL}>`,
        to,
        subject,
        html,
        text: this.stripHtml(html),
      });

      console.log(`✅ Email enviado para: ${to} - ID: ${info.messageId}`);
    } catch (error: any) {
      console.error('❌ Erro ao enviar email:', error);
      throw new Error('Falha ao enviar email');
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  // Email de boas-vindas com verificação
  async sendWelcomeEmail(email: string, name: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${ENV.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #123450 0%, #1e5a8e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #F9A60C; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo ao Sales Gamification!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${name}</strong>,</p>
            <p>Obrigado por se registrar no nosso sistema de gamificação de vendas da Fortal Engenharia Solar!</p>
            <p>Para começar a usar todas as funcionalidades, por favor confirme seu email clicando no botão abaixo:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Confirmar Email</a>
            </div>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #123450;">${verificationUrl}</p>
            <p><strong>Este link expira em 24 horas.</strong></p>
            <p>Se você não criou esta conta, por favor ignore este email.</p>
          </div>
          <div class="footer">
            <p>© 2025 Fortal Engenharia Solar - Sales Gamification</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '🎉 Bem-vindo! Confirme seu email',
      html,
    });
  }

  // Email de redefinição de senha
  async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void> {
    const resetUrl = `${ENV.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FC6E22 0%, #e65a1a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #FC6E22; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Redefinir Senha</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${name}</strong>,</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Redefinir Senha</a>
            </div>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #FC6E22;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este link expira em 1 hora</li>
                <li>Se você não solicitou esta redefinição, ignore este email</li>
                <li>Sua senha atual permanece segura até que você a altere</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 Fortal Engenharia Solar - Sales Gamification</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '🔐 Redefinição de Senha',
      html,
    });
  }

  // Email de confirmação de alteração de senha
  async sendPasswordChangedEmail(email: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20873a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Senha Alterada com Sucesso</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${name}</strong>,</p>
            <div class="success">
              <p><strong>✓</strong> Sua senha foi alterada com sucesso!</p>
            </div>
            <p>Se você não realizou esta alteração, entre em contato com o suporte imediatamente.</p>
            <p>Data da alteração: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          <div class="footer">
            <p>© 2025 Fortal Engenharia Solar - Sales Gamification</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '✅ Senha Alterada com Sucesso',
      html,
    });
  }

  // Email de notificação de nova venda
  async sendSaleNotification(email: string, name: string, saleValue: number, points: number): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #F9A60C 0%, #FC6E22 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .stats { background: white; border: 2px solid #F9A60C; border-radius: 10px; padding: 20px; margin: 20px 0; }
          .stat-item { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
          .stat-label { font-weight: bold; color: #666; }
          .stat-value { font-size: 20px; color: #123450; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎊 Nova Venda Registrada!</h1>
          </div>
          <div class="content">
            <p>Parabéns <strong>${name}</strong>! 🎉</p>
            <p>Uma nova venda foi registrada no sistema:</p>
            <div class="stats">
              <div class="stat-item">
                <span class="stat-label">💰 Valor da Venda:</span>
                <span class="stat-value">R$ ${saleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">⭐ Pontos Ganhos:</span>
                <span class="stat-value">+${points} pts</span>
              </div>
            </div>
            <p>Continue assim! Você está cada vez mais perto de alcançar suas metas e desbloquear novos benefícios!</p>
            <p style="text-align: center; margin-top: 30px;">
              <a href="${ENV.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 15px 30px; background: #F9A60C; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Dashboard</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2025 Fortal Engenharia Solar - Sales Gamification</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '🎊 Nova Venda Registrada!',
      html,
    });
  }

  // Email de nova comissão disponível
  async sendCommissionNotification(email: string, name: string, commissionValue: number, month: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #123450 0%, #F9A60C 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { background: linear-gradient(135deg, #F9A60C 0%, #FC6E22 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0; }
          .highlight h2 { margin: 0; font-size: 32px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Comissão Disponível!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${name}</strong>! 🎉</p>
            <p>Sua comissão referente ao período <strong>${month}</strong> está disponível:</p>
            <div class="highlight">
              <p style="margin: 0; font-size: 14px;">Valor da Comissão:</p>
              <h2>R$ ${commissionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            </div>
            <p>Acesse o sistema para ver mais detalhes sobre sua comissão.</p>
            <p style="text-align: center; margin-top: 30px;">
              <a href="${ENV.FRONTEND_URL}/commissions" style="display: inline-block; padding: 15px 30px; background: #123450; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Comissões</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2025 Fortal Engenharia Solar - Sales Gamification</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '💰 Comissão Disponível!',
      html,
    });
  }

  // Email de novo nível alcançado
  async sendLevelUpNotification(
    email: string, 
    name: string, 
    newLevel: string, 
    bonusAmount: number,
    bonusDescription: string
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FC6E22 0%, #F9A60C 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .level-badge { background: linear-gradient(135deg, #F9A60C 0%, #FC6E22 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .level-badge h2 { margin: 0; font-size: 36px; }
          .bonus { background: white; border-left: 4px solid #F9A60C; padding: 20px; margin: 20px 0; }
          .bonus-amount { font-size: 28px; color: #123450; font-weight: bold; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 Parabéns! Você Subiu de Nível!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${name}</strong>! 🎊</p>
            <p>Você alcançou um novo nível no sistema de gamificação:</p>
            <div class="level-badge">
              <p style="margin: 0; font-size: 16px;">Seu Novo Nível:</p>
              <h2>🌟 ${newLevel}</h2>
            </div>
            ${bonusAmount > 0 ? `
            <div class="bonus">
              <h3>🎁 Bônus de Avanço:</h3>
              <div class="bonus-amount">R$ ${bonusAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p>${bonusDescription}</p>
            </div>
            ` : ''}
            <p>Continue vendendo e alcançando suas metas para desbloquear ainda mais benefícios!</p>
            <p style="text-align: center; margin-top: 30px;">
              <a href="${ENV.FRONTEND_URL}/benefits" style="display: inline-block; padding: 15px 30px; background: #FC6E22; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Benefícios</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2025 Fortal Engenharia Solar - Sales Gamification</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '🏆 Parabéns! Você Subiu de Nível!',
      html,
    });
  }

  // Email de pagamento PIX aprovado
  async sendPixPaymentNotification(
    email: string,
    name: string,
    amount: number,
    paymentId: string,
    commissionsCount: number,
    paymentDate: Date
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .payment-card { background: white; border: 2px solid #22c55e; border-radius: 10px; padding: 30px; margin: 20px 0; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .payment-amount { font-size: 48px; color: #16a34a; font-weight: bold; margin: 20px 0; }
          .details { background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #d1fae5; }
          .detail-label { color: #6b7280; font-weight: 500; }
          .detail-value { color: #111827; font-weight: 600; }
          .cta-button { display: inline-block; padding: 15px 30px; background: #22c55e; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
          .cta-button:hover { background: #16a34a; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .icon { font-size: 64px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">💰</div>
            <h1>Pagamento PIX Aprovado!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Seu pagamento foi processado com sucesso</p>
          </div>
          <div class="content">
            <p>Olá <strong>${name}</strong>! 🎉</p>
            <p>Temos uma ótima notícia! Seu pagamento via PIX foi aprovado e processado pelo financeiro.</p>
            
            <div class="payment-card">
              <p style="margin: 0; color: #6b7280; font-size: 16px;">Valor Total</p>
              <div class="payment-amount">R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p style="margin: 0; color: #22c55e; font-weight: 600; font-size: 18px;">✓ PIX Enviado</p>
            </div>

            <div class="details">
              <h3 style="margin-top: 0; color: #111827;">📋 Detalhes do Pagamento</h3>
              <div class="detail-row">
                <span class="detail-label">ID do Pagamento:</span>
                <span class="detail-value">#${paymentId.substring(0, 8).toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Data e Hora:</span>
                <span class="detail-value">${paymentDate.toLocaleString('pt-BR')}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Comissões Pagas:</span>
                <span class="detail-value">${commissionsCount} comissão(ões)</span>
              </div>
              <div class="detail-row" style="border-bottom: none;">
                <span class="detail-label">Método de Pagamento:</span>
                <span class="detail-value">PIX</span>
              </div>
            </div>

            <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>ℹ️ Importante:</strong></p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>O valor será creditado em sua conta bancária em até 5 minutos</li>
                <li>Verifique sua conta para confirmar o recebimento</li>
                <li>Em caso de dúvidas, entre em contato com o financeiro</li>
              </ul>
            </div>

            <p>Continue com o excelente trabalho! Suas vendas estão gerando ótimos resultados. 💪</p>

            <div style="text-align: center;">
              <a href="${ENV.FRONTEND_URL}/financeiro" class="cta-button">
                Ver Meus Pagamentos
              </a>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 Fortal Engenharia Solar - Sales Gamification</p>
            <p>Este é um email automático, favor não responder.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '💰 Pagamento PIX Aprovado - Verifique sua Conta!',
      html,
    });
  }
}

export const emailService = new EmailService();
