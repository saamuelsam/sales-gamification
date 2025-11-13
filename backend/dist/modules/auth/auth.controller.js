"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const responses_1 = require("../../utils/responses");
const database_1 = require("../../config/database");
const authService = new auth_service_1.AuthService();
class AuthController {
    async register(req, res) {
        try {
            const { name, email, password, parent_id } = req.body;
            if (!name || !email || !password) {
                return responses_1.ApiResponse.error(res, 'Nome, email e senha são obrigatórios', 400);
            }
            if (password.length < 8) {
                return responses_1.ApiResponse.error(res, 'Senha deve ter no mínimo 8 caracteres', 400);
            }
            const user = await authService.register({ name, email, password, parent_id });
            return responses_1.ApiResponse.created(res, user, 'Usuário cadastrado com sucesso');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao cadastrar usuário';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return responses_1.ApiResponse.error(res, 'Email e senha são obrigatórios', 400);
            }
            const data = await authService.login(email, password);
            return responses_1.ApiResponse.success(res, data, 'Login realizado com sucesso');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao fazer login';
            return responses_1.ApiResponse.unauthorized(res, message);
        }
    }
    async me(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const result = await database_1.pool.query('SELECT id, name, email, role, email_verified, created_at FROM users WHERE id = $1', [userId]);
            if (result.rows.length === 0) {
                return responses_1.ApiResponse.error(res, 'Usuário não encontrado', 404);
            }
            return responses_1.ApiResponse.success(res, result.rows[0], 'Dados do usuário');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao obter dados do usuário';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async verifyEmail(req, res) {
        try {
            const { token } = req.query;
            if (!token || typeof token !== 'string') {
                return responses_1.ApiResponse.error(res, 'Token de verificação inválido', 400);
            }
            const result = await authService.verifyEmail(token);
            return responses_1.ApiResponse.success(res, result, 'Email verificado com sucesso!');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao verificar email';
            return responses_1.ApiResponse.error(res, message, 400);
        }
    }
    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return responses_1.ApiResponse.error(res, 'Email é obrigatório', 400);
            }
            const result = await authService.requestPasswordReset(email);
            return responses_1.ApiResponse.success(res, result, result.message);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao solicitar redefinição de senha';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async resetPassword(req, res) {
        try {
            const { token, password } = req.body;
            if (!token || !password) {
                return responses_1.ApiResponse.error(res, 'Token e senha são obrigatórios', 400);
            }
            if (password.length < 8) {
                return responses_1.ApiResponse.error(res, 'Senha deve ter no mínimo 8 caracteres', 400);
            }
            const result = await authService.resetPasswordWithToken(token, password);
            return responses_1.ApiResponse.success(res, result, 'Senha redefinida com sucesso!');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao redefinir senha';
            return responses_1.ApiResponse.error(res, message, 400);
        }
    }
    async resendVerification(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return responses_1.ApiResponse.error(res, 'Email é obrigatório', 400);
            }
            const result = await authService.resendVerificationEmail(email);
            return responses_1.ApiResponse.success(res, result, result.message);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao reenviar email de verificação';
            return responses_1.ApiResponse.error(res, message, 400);
        }
    }
}
exports.AuthController = AuthController;
