// backend/src/modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/responses';
import { pool } from '../../config/database'; // ← ADICIONAR ESTA LINHA

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
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao cadastrar usuário', 500);
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
    } catch (error: any) {
      return ApiResponse.unauthorized(res, error.message || 'Erro ao fazer login');
    }
  }

  async me(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      const result = await pool.query(
        'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return ApiResponse.error(res, 'Usuário não encontrado', 404);
      }

      return ApiResponse.success(res, result.rows[0], 'Dados do usuário');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}
