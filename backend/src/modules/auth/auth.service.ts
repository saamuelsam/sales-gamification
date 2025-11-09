// backend/src/modules/auth/auth.service.ts
import { pool } from '../../config/database';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../config/jwt';
import { logUserAccess, logFailedLogin, logPasswordReset } from '../../utils/loginLogger'; // ✅ Import

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

    // Inserir usuário
    // Inserir usuário
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, parent_id)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword, 'consultant', parent_id || null]
    );

    const userId = result.rows[0].id;

    // 🔧 Normaliza o UUID para formato válido do tipo LTREE (sem hífens)
    const cleanUserId = userId.replace(/-/g, '_');

    // Atualizar path hierárquico
    if (parent_id) {
      const parentResult = await pool.query('SELECT path FROM users WHERE id = $1', [parent_id]);
      const parentPath: string = parentResult.rows[0]?.path || '';
      const fullPath = parentPath ? `${parentPath}.${cleanUserId}` : cleanUserId;

      await pool.query(
        `UPDATE users SET path = $1::ltree WHERE id = $2`,
        [fullPath, userId]
      );
    } else {
      await pool.query(
        `UPDATE users SET path = $1::ltree WHERE id = $2`,
        [cleanUserId, userId]
      );
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
}

export const authService = new AuthService();
