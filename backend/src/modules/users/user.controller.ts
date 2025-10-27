// backend/src/modules/users/user.controller.ts

import { Request, Response } from 'express';
import { UserService } from './user.service';
import { ApiResponse } from '@utils/responses';

const userService = new UserService();

export class UserController {
  // Adicionar membro à equipe
  async addMember(req: Request, res: Response) {
    try {
      const parentId = req.user.userId; // Quem está adicionando
      const member = await userService.addTeamMember(parentId, req.body);
      return ApiResponse.created(res, member, 'Membro adicionado à equipe');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // Buscar membros diretos
  async getMyTeam(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const team = await userService.getDirectTeamMembers(userId);
      return ApiResponse.success(res, team, 'Membros da equipe');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // Buscar rede completa
  async getFullNetwork(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const network = await userService.getFullNetwork(userId);
      return ApiResponse.success(res, network, 'Rede completa');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // Estatísticas da equipe
  async getTeamStats(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const stats = await userService.getTeamStats(userId);
      return ApiResponse.success(res, stats, 'Estatísticas da equipe');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // Verificar se tem equipe
  async checkHasTeam(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const hasTeam = await userService.hasTeam(userId);
      return ApiResponse.success(res, { has_team: hasTeam });
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}
