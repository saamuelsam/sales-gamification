// backend/src/modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/responses';
import { hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '@config/database';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password, parent_id } = req.body;

      if (!name || !email || !password) {
        return ApiResponse.error(res, 'Nome, email e senha são obrigatórios', 400);
      }

      if (password.length < 8) {
        return ApiResponse.error(res, 'Senha deve ter no mínimo 8 caracteres', 400);
      }

      const user = await authService.register({ name, email, password, parent_id });
      return ApiResponse.created(res, user, 'Usuário cadastrado com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao cadastrar usuário';
      return ApiResponse.error(res, message, 500);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return ApiResponse.error(res, 'Email e senha são obrigatórios', 400);
      }

      const data = await authService.login(email, password);
      return ApiResponse.success(res, data, 'Login realizado com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      return ApiResponse.unauthorized(res, message);
    }
  }

  async me(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const result = await pool.query(
        'SELECT id, name, email, role, email_verified, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return ApiResponse.error(res, 'Usuário não encontrado', 404);
      }

      return ApiResponse.success(res, result.rows[0], 'Dados do usuário');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao obter dados do usuário';
      return ApiResponse.error(res, message, 500);
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return ApiResponse.error(res, 'Token de verificação inválido', 400);
      }

      const result = await authService.verifyEmail(token);
      return ApiResponse.success(res, result, 'Email verificado com sucesso!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao verificar email';
      return ApiResponse.error(res, message, 400);
    }
  }

  async requestPasswordReset(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return ApiResponse.error(res, 'Email é obrigatório', 400);
      }

      const result = await authService.requestPasswordReset(email);
      return ApiResponse.success(res, result, result.message);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao solicitar redefinição de senha';
      return ApiResponse.error(res, message, 500);
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return ApiResponse.error(res, 'Token e senha são obrigatórios', 400);
      }

      if (password.length < 8) {
        return ApiResponse.error(res, 'Senha deve ter no mínimo 8 caracteres', 400);
      }

      const result = await authService.resetPasswordWithToken(token, password);
      return ApiResponse.success(res, result, 'Senha redefinida com sucesso!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao redefinir senha';
      return ApiResponse.error(res, message, 400);
    }
  }

  async resendVerification(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return ApiResponse.error(res, 'Email é obrigatório', 400);
      }

      const result = await authService.resendVerificationEmail(email);
      return ApiResponse.success(res, result, result.message);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao reenviar email de verificação';
      return ApiResponse.error(res, message, 400);
    }
  }
}
