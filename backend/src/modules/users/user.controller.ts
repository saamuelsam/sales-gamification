// backend/src/modules/users/user.controller.ts

import { Request, Response } from 'express';
import { UserService } from './user.service';
import { ApiResponse } from '@utils/responses';

const userService = new UserService();

export class UserController {
  // ========== MÉTODOS DE DASHBOARD ==========

  async getDashboard(req: Request, res: Response) {
    try {
      const userId = req.user?.userId || (req as any).user?.id;
      
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const dashboard = await userService.getDashboard(userId);
      
      // ✅ Garantir que é um objeto plano
      const data = {
        total_sales: parseInt(dashboard.total_sales) || 0,
        total_revenue: parseFloat(dashboard.total_revenue) || 0,
        total_kilowatts: parseFloat(dashboard.total_kilowatts) || 0,
        total_points: parseFloat(dashboard.total_points) || 0,
        level: dashboard.level || 'Consultor Elite',
        team_members: parseInt(dashboard.team_members) || 0,
      };
      
      return ApiResponse.success(res, data, 'Dashboard carregado');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar dashboard';
      console.error('Erro no getDashboard:', message);
      return ApiResponse.error(res, message, 500);
    }
  }

  // ========== MÉTODOS DE EQUIPE ==========

  async addMember(req: Request, res: Response) {
    try {
      const parentId = req.user?.userId;
      if (!parentId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const member = await userService.addTeamMember(parentId, req.body);
      return ApiResponse.created(res, member, 'Membro adicionado à equipe');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao adicionar membro';
      return ApiResponse.error(res, message, 500);
    }
  }

  async getMyTeam(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const team = await userService.getDirectTeamMembers(userId);
      return ApiResponse.success(res, team, 'Membros da equipe');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar membros da equipe';
      return ApiResponse.error(res, message, 500);
    }
  }

  async getFullNetwork(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const network = await userService.getFullNetwork(userId);
      return ApiResponse.success(res, network, 'Rede completa');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar rede completa';
      return ApiResponse.error(res, message, 500);
    }
  }

  async getTeamStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const stats = await userService.getTeamStats(userId);
      return ApiResponse.success(res, stats, 'Estatísticas da equipe');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar estatísticas';
      return ApiResponse.error(res, message, 500);
    }
  }

  async checkHasTeam(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const hasTeam = await userService.hasTeam(userId);
      return ApiResponse.success(res, { has_team: hasTeam });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao verificar equipe';
      return ApiResponse.error(res, message, 500);
    }
  }

  // ========== MÉTODOS GERAIS ==========

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

export const userController = new UserController();
