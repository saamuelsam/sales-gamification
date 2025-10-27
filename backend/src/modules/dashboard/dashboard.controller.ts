import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
import { ApiResponse } from '../../utils/responses';

const dashboardService = new DashboardService();

export class DashboardController {
  // Dashboard pessoal
  async getPersonal(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const data = await dashboardService.getPersonalDashboard(userId);
      return ApiResponse.success(res, data, 'Dashboard pessoal');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar dashboard', 500);
    }
  }

  // Dashboard da equipe
  async getTeam(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const data = await dashboardService.getTeamDashboard(userId);
      return ApiResponse.success(res, data, 'Dashboard da equipe');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar dashboard da equipe', 500);
    }
  }

  // Dashboard completo (combinado)
  async getComplete(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      const personal = await dashboardService.getPersonalDashboard(userId);
      const team = await dashboardService.getTeamDashboard(userId);

      // Se for admin, incluir dados gerais
      let admin = null;
      if (userRole === 'admin') {
        admin = await dashboardService.getAdminDashboard();
      }

      return ApiResponse.success(res, {
        personal,
        team,
        has_team: team.members.length > 0,
        admin,
      }, 'Dashboard completo');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar dashboard', 500);
    }
  }

  // Dashboard admin
  async getAdmin(req: Request, res: Response) {
    try {
      const userRole = (req as any).user?.role;

      if (userRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Acesso negado');
      }

      const data = await dashboardService.getAdminDashboard();
      return ApiResponse.success(res, data, 'Dashboard administrativo');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar dashboard admin', 500);
    }
  }
}
