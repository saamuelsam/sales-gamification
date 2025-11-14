import { pool } from '../config/database';
import { logger } from './logger';
import { logActivity } from './activityLogger';

/**
 * Registra login e logout do usuário
 */
export async function logUserAccess(
  userId: string,
  action: 'login' | 'logout',
  ip?: string,
  userAgent?: string
) {
  try {
    await pool.query(
      `INSERT INTO login_logs (user_id, ip_address, user_agent, action, success, created_at)
       VALUES ($1, $2, $3, $4, true, NOW())`,
      [userId, ip || null, userAgent || null, action]
    );

    await logActivity(userId, `Usuário fez ${action}`, { ip, userAgent });

    logger.info(`✅ [LOGIN_LOG] ${action.toUpperCase()} registrado para usuário ${userId}`);
  } catch (error: any) {
    logger.error(`❌ Erro ao registrar log de ${action}: ${error.message}`);
  }
}

/**
 * Registra tentativas de login com falha
 */
export async function logFailedLogin(email: string, ip?: string, userAgent?: string) {
  try {
    // Busca o user_id pelo email para registrar corretamente
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null;

    await pool.query(
      `INSERT INTO login_logs (user_id, ip_address, user_agent, action, success, created_at)
       VALUES ($1, $2, $3, 'failed_login', false, NOW())`,
      [userId, ip || null, userAgent || null]
    );

    logger.warn(`⚠️ [LOGIN_FAIL] Tentativa de login falhou para o email: ${email}`);
  } catch (error: any) {
    logger.error(`❌ Erro ao registrar login falho: ${error.message}`);
  }
}

/**
 * Registra redefinição de senha
 */
export async function logPasswordReset(userId: string, ip?: string, userAgent?: string) {
  try {
    await pool.query(
      `INSERT INTO login_logs (user_id, ip_address, user_agent, action, success, created_at)
       VALUES ($1, $2, $3, 'password_reset', true, NOW())`,
      [userId, ip || null, userAgent || null]
    );

    await logActivity(userId, `Usuário redefiniu senha`, { ip, userAgent });

    logger.info(`🔐 [PASSWORD_RESET] Senha redefinida para usuário ${userId}`);
  } catch (error: any) {
    logger.error(`❌ Erro ao registrar redefinição de senha: ${error.message}`);
  }
}
