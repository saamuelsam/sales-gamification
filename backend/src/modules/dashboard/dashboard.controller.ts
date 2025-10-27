import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
import { ApiResponse } from '../../utils/responses';

const dashboardService = new DashboardService();

export class DashboardController {
  // Dashboard pessoal
  async getPersonal(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }
      const data = await dashboardService.getPersonalDashboard(userId);
      return ApiResponse.success(res, data, 'Dashboard pessoal');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar dashboard';
      return ApiResponse.error(res, message, 500);
    }
  }

  // Dashboard da equipe
  async getTeam(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }
      const data = await dashboardService.getTeamDashboard(userId);
      return ApiResponse.success(res, data, 'Dashboard da equipe');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar dashboard da equipe';
      return ApiResponse.error(res, message, 500);
    }
  }

  // Dashboard completo (combinado)
  async getComplete(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const personal = await dashboardService.getPersonalDashboard(userId);
      const team = await dashboardService.getTeamDashboard(userId);

      let admin: any = null;
      if (userRole === 'admin') {
        admin = await dashboardService.getAdminDashboard();
      }

      return ApiResponse.success(
        res,
        {
          personal,
          team,
          has_team: Array.isArray(team.members) && team.members.length > 0,
          admin,
        },
        'Dashboard completo'
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar dashboard';
      return ApiResponse.error(res, message, 500);
    }
  }

  // Dashboard admin
  async getAdmin(req: Request, res: Response) {
    try {
      const userRole = req.user?.role;

      if (userRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Acesso negado');
      }

      const data = await dashboardService.getAdminDashboard();
      return ApiResponse.success(res, data, 'Dashboard administrativo');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar dashboard admin';
      return ApiResponse.error(res, message, 500);
    }
  }
}
