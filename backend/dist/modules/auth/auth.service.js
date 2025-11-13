"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
// backend/src/modules/auth/auth.service.ts
const database_1 = require("../../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const jwt_1 = require("../../config/jwt");
const loginLogger_1 = require("../../utils/loginLogger");
const email_service_1 = require("../../services/email.service");
class AuthService {
    /**
     * ✅ Registrar novo usuário
     */
    async register(data) {
        const { name, email, password, parent_id } = data;
        // Verificar se email já existe
        const existingUser = await database_1.pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            throw new Error('Email já cadastrado');
        }
        // Hash da senha
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Gerar token de verificação
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
        // Inserir usuário
        const result = await database_1.pool.query(`INSERT INTO users (name, email, password, role, parent_id, email_verification_token, email_verification_expires)
   VALUES ($1, $2, $3, $4, $5, $6, $7)
   RETURNING id, name, email, role, created_at`, [name, email, hashedPassword, 'consultant', parent_id || null, verificationToken, verificationExpires]);
        const userId = result.rows[0].id;
        // 🔧 Normaliza o UUID para formato válido do tipo LTREE (sem hífens)
        const cleanUserId = userId.replace(/-/g, '_');
        // Atualizar path hierárquico e user_hierarchy
        if (parent_id) {
            // Se tem parent, atualiza o path e insere na hierarquia
            const parentResult = await database_1.pool.query('SELECT path FROM users WHERE id = $1', [parent_id]);
            const parentPath = parentResult.rows[0]?.path || '';
            const fullPath = parentPath ? `${parentPath}.${cleanUserId}` : cleanUserId;
            await database_1.pool.query(`UPDATE users SET path = $1::ltree WHERE id = $2`, [fullPath, userId]);
            // Inserir na hierarquia
            await database_1.pool.query(`INSERT INTO user_hierarchy (leader_id, subordinate_id, line_level, joined_at)
         VALUES ($1, $2, 1, NOW())
         ON CONFLICT DO NOTHING`, [parent_id, userId]);
        }
        else {
            // Se não tem parent, apenas define o path com o próprio ID
            await database_1.pool.query(`UPDATE users SET path = $1::ltree WHERE id = $2`, [cleanUserId, userId]);
        }
        // Enviar email de boas-vindas com verificação
        try {
            await email_service_1.emailService.sendWelcomeEmail(email, name, verificationToken);
        }
        catch (error) {
            console.error('Erro ao enviar email de boas-vindas:', error);
            // Não bloqueia o registro se falhar o email
        }
        return result.rows[0];
    }
    /**
     * ✅ Login do usuário (com log de acesso)
     */
    async login(email, password, ip, userAgent) {
        try {
            // Buscar usuário
            const result = await database_1.pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (result.rows.length === 0) {
                // ✅ Registrar tentativa falha
                await (0, loginLogger_1.logFailedLogin)(email, ip, userAgent);
                throw new Error('Email ou senha inválidos');
            }
            const user = result.rows[0];
            // Verificar senha
            const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
            if (!isValidPassword) {
                // ✅ Registrar tentativa falha
                await (0, loginLogger_1.logFailedLogin)(email, ip, userAgent);
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
            await (0, loginLogger_1.logUserAccess)(user.id, 'login', ip, userAgent);
            // Gerar token JWT
            const token = (0, jwt_1.generateToken)({
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
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * ✅ Logout do usuário (novo método)
     */
    async logout(userId, ip, userAgent) {
        try {
            // ✅ Registrar logout
            await (0, loginLogger_1.logUserAccess)(userId, 'logout', ip, userAgent);
            return { success: true, message: 'Logout realizado com sucesso' };
        }
        catch (error) {
            throw new Error('Erro ao realizar logout');
        }
    }
    /**
     * ✅ Redefinir senha (novo método)
     */
    async resetPassword(userId, newPassword, ip, userAgent) {
        try {
            // Hash da nova senha
            const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
            // Atualizar senha
            await database_1.pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
            // ✅ Registrar redefinição de senha
            await (0, loginLogger_1.logPasswordReset)(userId, ip, userAgent);
            return { success: true, message: 'Senha redefinida com sucesso' };
        }
        catch (error) {
            throw new Error('Erro ao redefinir senha');
        }
    }
    /**
     * ✅ Verificar email do usuário
     */
    async verifyEmail(token) {
        try {
            const result = await database_1.pool.query('SELECT id, name, email FROM users WHERE email_verification_token = $1 AND email_verification_expires > NOW()', [token]);
            if (result.rows.length === 0) {
                throw new Error('Token inválido ou expirado');
            }
            const user = result.rows[0];
            // Marcar email como verificado
            await database_1.pool.query('UPDATE users SET email_verified = true, email_verification_token = NULL, email_verification_expires = NULL WHERE id = $1', [user.id]);
            return { success: true, message: 'Email verificado com sucesso!', user };
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * ✅ Solicitar reset de senha
     */
    async requestPasswordReset(email) {
        try {
            const result = await database_1.pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
            if (result.rows.length === 0) {
                // Não revela se o email existe
                return { success: true, message: 'Se o email existir, você receberá instruções para redefinir sua senha.' };
            }
            const user = result.rows[0];
            // Gerar token de reset
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
            // Salvar token no banco
            await database_1.pool.query('UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3', [resetToken, resetExpires, user.id]);
            // Enviar email
            try {
                await email_service_1.emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
                console.log('✅ Email de reset enviado para:', user.email);
            }
            catch (error) {
                console.error('❌ Erro ao enviar email de reset:', error.message || error);
                console.error('Stack:', error.stack);
                // Não bloqueia o fluxo - retorna sucesso mesmo se email falhar
                // O token foi salvo no banco, então pode ser usado manualmente se necessário
            }
            return { success: true, message: 'Se o email existir, você receberá instruções para redefinir sua senha.' };
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * ✅ Redefinir senha com token
     */
    async resetPasswordWithToken(token, newPassword) {
        try {
            const result = await database_1.pool.query('SELECT id, name, email FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()', [token]);
            if (result.rows.length === 0) {
                throw new Error('Token inválido ou expirado');
            }
            const user = result.rows[0];
            // Hash da nova senha
            const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
            // Atualizar senha e limpar token
            await database_1.pool.query('UPDATE users SET password = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2', [hashedPassword, user.id]);
            // Enviar email de confirmação
            try {
                await email_service_1.emailService.sendPasswordChangedEmail(user.email, user.name);
            }
            catch (error) {
                console.error('Erro ao enviar email de confirmação:', error);
            }
            return { success: true, message: 'Senha redefinida com sucesso!' };
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * ✅ Reenviar email de verificação
     */
    async resendVerificationEmail(email) {
        try {
            const result = await database_1.pool.query('SELECT id, name, email, email_verified FROM users WHERE email = $1', [email]);
            if (result.rows.length === 0) {
                throw new Error('Email não encontrado');
            }
            const user = result.rows[0];
            if (user.email_verified) {
                throw new Error('Email já verificado');
            }
            // Gerar novo token
            const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
            const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await database_1.pool.query('UPDATE users SET email_verification_token = $1, email_verification_expires = $2 WHERE id = $3', [verificationToken, verificationExpires, user.id]);
            // Enviar email
            await email_service_1.emailService.sendWelcomeEmail(user.email, user.name, verificationToken);
            return { success: true, message: 'Email de verificação reenviado com sucesso!' };
        }
        catch (error) {
            throw error;
        }
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
