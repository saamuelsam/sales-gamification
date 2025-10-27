// Extensão do backend/src/modules/users/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from './user.service';
import { ApiResponse } from '@utils/responses';

const userService = new UserService();

export class UserController {
  // ... seus métodos atuais (addMember, getMyTeam, getFullNetwork, getTeamStats, checkHasTeam)

  async list(req: Request, res: Response) {
    try {
      const users = await userService.list();
      return ApiResponse.success(res, users, 'Usuários listados');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao listar usuários';
      return ApiResponse.error(res, message, 500);
    }
  }

  async find(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return ApiResponse.error(res, 'ID é obrigatório', 400);
      }
      const user = await userService.findById(id);
      return ApiResponse.success(res, user, 'Usuário encontrado');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar usuário';
      return ApiResponse.error(res, message, 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return ApiResponse.error(res, 'ID é obrigatório', 400);
      }
      const user = await userService.update(id, req.body);
      return ApiResponse.success(res, user, 'Usuário atualizado');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar usuário';
      return ApiResponse.error(res, message, 500);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return ApiResponse.error(res, 'ID é obrigatório', 400);
      }
      await userService.remove(id);
      return ApiResponse.success(res, null, 'Usuário removido');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao remover usuário';
      return ApiResponse.error(res, message, 500);
    }
  }
}
