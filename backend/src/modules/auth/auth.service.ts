// backend/src/modules/auth/auth.service.ts
import { pool } from '../../config/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateToken } from '../../config/jwt';
import { logUserAccess, logFailedLogin, logPasswordReset } from '../../utils/loginLogger';
import { emailService } from '../../services/email.service';

export class AuthService {
  /**
   * ✅ Registrar novo usuário
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    parent_id?: string
  }) {
    const { name, email, password, parent_id } = data;

    // Verificar se email já existe
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Gerar token de verificação
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Inserir usuário
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, parent_id, email_verification_token, email_verification_expires)
   VALUES ($1, $2, $3, $4, $5, $6, $7)
   RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword, 'consultant', parent_id || null, verificationToken, verificationExpires]
    );

    const userId = result.rows[0].id;

    // 🔧 Normaliza o UUID para formato válido do tipo LTREE (sem hífens)
    const cleanUserId = userId.replace(/-/g, '_');

    // Atualizar path hierárquico e user_hierarchy
    if (parent_id) {
      // Se tem parent, atualiza o path e insere na hierarquia
      const parentResult = await pool.query('SELECT path FROM users WHERE id = $1', [parent_id]);
      const parentPath: string = parentResult.rows[0]?.path || '';
      const fullPath = parentPath ? `${parentPath}.${cleanUserId}` : cleanUserId;

      await pool.query(
        `UPDATE users SET path = $1::ltree WHERE id = $2`,
        [fullPath, userId]
      );

      // Inserir na hierarquia
      await pool.query(
        `INSERT INTO user_hierarchy (leader_id, subordinate_id, line_level, joined_at)
         VALUES ($1, $2, 1, NOW())
         ON CONFLICT DO NOTHING`,
        [parent_id, userId]
      );
    } else {
      // Se não tem parent, apenas define o path com o próprio ID
      await pool.query(
        `UPDATE users SET path = $1::ltree WHERE id = $2`,
        [cleanUserId, userId]
      );
    }

    // Enviar email de boas-vindas com verificação
    try {
      await emailService.sendWelcomeEmail(email, name, verificationToken);
    } catch (error) {
      console.error('Erro ao enviar email de boas-vindas:', error);
      // Não bloqueia o registro se falhar o email
    }

    return result.rows[0];

  }

  /**
   * ✅ Login do usuário (com log de acesso)
   */
  async login(email: string, password: string, ip?: string, userAgent?: string) {
    try {
      // Buscar usuário
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        // ✅ Registrar tentativa falha
        await logFailedLogin(email, ip, userAgent);
        throw new Error('Email ou senha inválidos');
      }

      const user = result.rows[0];

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        // ✅ Registrar tentativa falha
        await logFailedLogin(email, ip, userAgent);
        throw new Error('Email ou senha inválidos');
      }

      // Verificar se usuário está ativo
      if (!user.is_active) {
        throw new Error('Usuário inativo. Entre em contato com o administrador.');
      }

      // Verificar se email foi verificado
      if (!user.email_verified) {
        throw new Error('Por favor, verifique seu email antes de fazer login.');
      }

      // ✅ Registrar login bem-sucedido
      await logUserAccess(user.id, 'login', ip, userAgent);

      // Gerar token JWT
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Remover senha do retorno
      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * ✅ Logout do usuário (novo método)
   */
  async logout(userId: string, ip?: string, userAgent?: string) {
    try {
      // ✅ Registrar logout
      await logUserAccess(userId, 'logout', ip, userAgent);

      return { success: true, message: 'Logout realizado com sucesso' };
    } catch (error: any) {
      throw new Error('Erro ao realizar logout');
    }
  }

  /**
   * ✅ Redefinir senha (novo método)
   */
  async resetPassword(
    userId: string,
    newPassword: string,
    ip?: string,
    userAgent?: string
  ) {
    try {
      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar senha
      await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, userId]
      );

      // ✅ Registrar redefinição de senha
      await logPasswordReset(userId, ip, userAgent);

      return { success: true, message: 'Senha redefinida com sucesso' };
    } catch (error: any) {
      throw new Error('Erro ao redefinir senha');
    }
  }

  /**
   * ✅ Verificar email do usuário
   */
  async verifyEmail(token: string) {
    try {
      const result = await pool.query(
        'SELECT id, name, email FROM users WHERE email_verification_token = $1 AND email_verification_expires > NOW()',
        [token]
      );

      if (result.rows.length === 0) {
        throw new Error('Token inválido ou expirado');
      }

      const user = result.rows[0];

      // Marcar email como verificado
      await pool.query(
        'UPDATE users SET email_verified = true, email_verification_token = NULL, email_verification_expires = NULL WHERE id = $1',
        [user.id]
      );

      return { success: true, message: 'Email verificado com sucesso!', user };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * ✅ Solicitar reset de senha
   */
  async requestPasswordReset(email: string) {
    try {
      const result = await pool.query(
        'SELECT id, name, email FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        // Não revela se o email existe
        return { success: true, message: 'Se o email existir, você receberá instruções para redefinir sua senha.' };
      }

      const user = result.rows[0];

      // Gerar token de reset
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Salvar token no banco
      await pool.query(
        'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
        [resetToken, resetExpires, user.id]
      );

      // Enviar email
      try {
        await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
        console.log('✅ Email de reset enviado para:', user.email);
      } catch (error: any) {
        console.error('❌ Erro ao enviar email de reset:', error.message || error);
        console.error('Stack:', error.stack);
        // Não bloqueia o fluxo - retorna sucesso mesmo se email falhar
        // O token foi salvo no banco, então pode ser usado manualmente se necessário
      }

      return { success: true, message: 'Se o email existir, você receberá instruções para redefinir sua senha.' };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * ✅ Redefinir senha com token
   */
  async resetPasswordWithToken(token: string, newPassword: string) {
    try {
      const result = await pool.query(
        'SELECT id, name, email FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
        [token]
      );

      if (result.rows.length === 0) {
        throw new Error('Token inválido ou expirado');
      }

      const user = result.rows[0];

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar senha e limpar token
      await pool.query(
        'UPDATE users SET password = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
        [hashedPassword, user.id]
      );

      // Enviar email de confirmação
      try {
        await emailService.sendPasswordChangedEmail(user.email, user.name);
      } catch (error) {
        console.error('Erro ao enviar email de confirmação:', error);
      }

      return { success: true, message: 'Senha redefinida com sucesso!' };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * ✅ Reenviar email de verificação
   */
  async resendVerificationEmail(email: string) {
    try {
      const result = await pool.query(
        'SELECT id, name, email, email_verified FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error('Email não encontrado');
      }

      const user = result.rows[0];

      if (user.email_verified) {
        throw new Error('Email já verificado');
      }

      // Gerar novo token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await pool.query(
        'UPDATE users SET email_verification_token = $1, email_verification_expires = $2 WHERE id = $3',
        [verificationToken, verificationExpires, user.id]
      );

      // Enviar email
      await emailService.sendWelcomeEmail(user.email, user.name, verificationToken);

      return { success: true, message: 'Email de verificação reenviado com sucesso!' };
    } catch (error: any) {
      throw error;
    }
  }
}

export const authService = new AuthService();
