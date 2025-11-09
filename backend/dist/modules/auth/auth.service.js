"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
// backend/src/modules/auth/auth.service.ts
const database_1 = require("../../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../../config/jwt");
const loginLogger_1 = require("../../utils/loginLogger"); // ✅ Import
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
        // Inserir usuário
        const result = await database_1.pool.query(`INSERT INTO users (name, email, password, role, parent_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, created_at`, [name, email, hashedPassword, 'consultant', parent_id || null]);
        const userId = result.rows[0].id;
        // Atualizar path hierárquico
        if (parent_id) {
            const parentResult = await database_1.pool.query('SELECT path FROM users WHERE id = $1', [parent_id]);
            const parentPath = parentResult.rows[0]?.path || '';
            const fullPath = parentPath ? `${parentPath}.${userId}` : userId;
            await database_1.pool.query(`UPDATE users SET path = $1::ltree WHERE id = $2`, [fullPath, userId]);
        }
        else {
            await database_1.pool.query(`UPDATE users SET path = $1::ltree WHERE id = $2`, [userId, userId]);
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
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
