"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logUserAccess = logUserAccess;
exports.logFailedLogin = logFailedLogin;
exports.logPasswordReset = logPasswordReset;
const database_1 = require("../config/database");
const logger_1 = require("./logger");
const activityLogger_1 = require("./activityLogger");
/**
 * Registra login e logout do usuário
 */
async function logUserAccess(userId, action, ip, userAgent) {
    try {
        await database_1.pool.query(`INSERT INTO login_logs (user_id, ip_address, user_agent, action, created_at)
       VALUES ($1, $2, $3, $4, NOW())`, [userId, ip || null, userAgent || null, action]);
        await (0, activityLogger_1.logActivity)(userId, `Usuário fez ${action}`, { ip, userAgent });
        logger_1.logger.info(`✅ [LOGIN_LOG] ${action.toUpperCase()} registrado para usuário ${userId}`);
    }
    catch (error) {
        logger_1.logger.error(`❌ Erro ao registrar log de ${action}: ${error.message}`);
    }
}
/**
 * Registra tentativas de login com falha
 */
async function logFailedLogin(email, ip, userAgent) {
    try {
        await database_1.pool.query(`INSERT INTO login_logs (user_id, ip_address, user_agent, action, created_at)
       VALUES (NULL, $1, $2, 'failed_login', NOW())`, [ip || null, userAgent || null]);
        logger_1.logger.warn(`⚠️ [LOGIN_FAIL] Tentativa de login falhou para o email: ${email}`);
    }
    catch (error) {
        logger_1.logger.error(`❌ Erro ao registrar login falho: ${error.message}`);
    }
}
/**
 * Registra redefinição de senha
 */
async function logPasswordReset(userId, ip, userAgent) {
    try {
        await database_1.pool.query(`INSERT INTO login_logs (user_id, ip_address, user_agent, action, created_at)
       VALUES ($1, $2, $3, 'password_reset', NOW())`, [userId, ip || null, userAgent || null]);
        await (0, activityLogger_1.logActivity)(userId, `Usuário redefiniu senha`, { ip, userAgent });
        logger_1.logger.info(`🔐 [PASSWORD_RESET] Senha redefinida para usuário ${userId}`);
    }
    catch (error) {
        logger_1.logger.error(`❌ Erro ao registrar redefinição de senha: ${error.message}`);
    }
}
