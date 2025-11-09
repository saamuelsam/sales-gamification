import { Request, Response } from 'express';
import { adminService } from './admin.service';
import { logger } from '../../utils/logger';

export class AdminController {
  /** GET /api/admin/dashboard */
  async getDashboard(req: Request, res: Response) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ success: true, data: stats, message: 'Estatísticas carregadas com sucesso' });
    } catch (error: any) {
      logger.error(`Erro ao buscar estatísticas: ${error.message}`);
      res.status(500).json({ success: false, message: 'Erro ao carregar estatísticas' });
    }
  }

  /** GET /api/admin/users */
  async getUsers(req: Request, res: Response) {
    try {
      const users = await adminService.getAllUsers();
      res.json({ success: true, data: users, count: users.length, message: 'Usuários carregados com sucesso' });
    } catch (error: any) {
      logger.error(`Erro ao buscar usuários: ${error.message}`);
      res.status(500).json({ success: false, message: 'Erro ao carregar usuários' });
    }
  }

  /** PATCH /api/admin/users/:id/status */
  async toggleUserStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const adminId = (req as any).user?.userId;

      if (typeof is_active !== 'boolean') {
        return res.status(400).json({ success: false, message: 'O campo is_active deve ser um booleano' });
      }

      await adminService.updateUserStatus(id, is_active, adminId);
      res.json({ success: true, message: `Usuário ${is_active ? 'ativado' : 'desativado'} com sucesso` });
    } catch (error: any) {
      logger.error(`Erro ao atualizar status: ${error.message}`);
      res.status(500).json({ success: false, message: error.message || 'Erro ao atualizar status do usuário' });
    }
  }

  /** PATCH /api/admin/users/:id/role */
  async updateUserRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const adminId = (req as any).user?.userId;

      const validRoles = ['consultant', 'master_consultant', 'senior_consultant', 'prime_consultant', 'executive', 'admin', 'ceo'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Função inválida' });
      }

      await adminService.updateUserRole(id, role, adminId);
      res.json({ success: true, message: 'Função atualizada com sucesso' });
    } catch (error: any) {
      logger.error(`Erro ao atualizar função: ${error.message}`);
      res.status(500).json({ success: false, message: error.message || 'Erro ao atualizar função do usuário' });
    }
  }

  /** GET /api/admin/teams */
  async getTeams(req: Request, res: Response) {
    try {
      const teams = await adminService.getTeamsSummary();
      res.json({ success: true, data: teams, count: teams.length, message: 'Equipes carregadas com sucesso' });
    } catch (error: any) {
      logger.error(`Erro ao buscar equipes: ${error.message}`);
      res.status(500).json({ success: false, message: 'Erro ao carregar equipes' });
    }
  }

    /** GET /api/admin/commissions */
  async getAllCommissions(req: Request, res: Response) {
    try {
      const { status, search } = req.query;
      const commissions = await adminService.getAllCommissions(status as string, search as string);
      res.json({
        success: true,
        data: commissions,
        count: commissions.length,
        message: 'Comissões carregadas com sucesso'
      });
    } catch (error: any) {
      logger.error(`Erro ao buscar comissões: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar comissões'
      });
    }
  }

  /** PATCH /api/admin/commissions/:id/paid */
  async markCommissionAsPaid(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.userId;
      await adminService.markCommissionAsPaid(id, adminId);
      res.json({
        success: true,
        message: 'Comissão marcada como paga com sucesso'
      });
    } catch (error: any) {
      logger.error(`Erro ao marcar comissão como paga: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao marcar comissão como paga'
      });
    }
  }

  /** GET /api/admin/commissions/export */
  async exportCommissionsCSV(req: Request, res: Response) {
    try {
      const csv = await adminService.exportCommissionsCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=commissions.csv');
      res.send(csv);
    } catch (error: any) {
      logger.error(`Erro ao exportar CSV: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Erro ao exportar comissões'
      });
    }
  }

  /** GET /api/admin/config */
  async getConfig(req: Request, res: Response) {
    try {
      const config = await adminService.getSystemConfig();
      res.json({ success: true, data: config, message: 'Configurações carregadas com sucesso' });
    } catch (error: any) {
      logger.error(`Erro ao buscar configurações: ${error.message}`);
      res.status(500).json({ success: false, message: 'Erro ao carregar configurações' });
    }
  }

  /** PATCH /api/admin/config */
  async updateConfig(req: Request, res: Response) {
    try {
      const adminId = (req as any).user?.userId;
      const config = await adminService.updateSystemConfig(req.body, adminId);
      res.json({ success: true, data: config, message: 'Configurações atualizadas com sucesso' });
    } catch (error: any) {
      logger.error(`Erro ao atualizar configurações: ${error.message}`);
      res.status(500).json({ success: false, message: 'Erro ao atualizar configurações' });
    }
  }

  /** GET /api/admin/notifications */
  async getNotifications(req: Request, res: Response) {
    try {
      const notifications = await adminService.getAllNotifications();
      res.json({ success: true, data: notifications, count: notifications.length, message: 'Notificações carregadas com sucesso' });
    } catch (error: any) {
      logger.error(`Erro ao buscar notificações: ${error.message}`);
      res.status(500).json({ success: false, message: 'Erro ao carregar notificações' });
    }
  }

  /** POST /api/admin/notifications */
  async createNotification(req: Request, res: Response) {
    try {
      const { title, message, type, target } = req.body;
      const adminId = (req as any).user?.userId;

      if (!title || !message || !type) {
        return res.status(400).json({ success: false, message: 'Campos obrigatórios: title, message, type' });
      }

      const result = await adminService.createGlobalNotification(title, message, type, target || 'all', adminId);
      res.json({ success: true, data: result, message: `Notificação enviada para ${result.count} usuários` });
    } catch (error: any) {
      logger.error(`Erro ao criar notificação: ${error.message}`);
      res.status(500).json({ success: false, message: 'Erro ao criar notificação' });
    }
  }

  /** DELETE /api/admin/notifications/:id */
  async deleteNotification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await adminService.deleteNotification(id);
      res.json({ success: true, message: 'Notificação deletada com sucesso' });
    } catch (error: any) {
      logger.error(`Erro ao deletar notificação: ${error.message}`);
      res.status(500).json({ success: false, message: 'Erro ao deletar notificação' });
    }
  }

  /** GET /api/admin/logs */
  async getLogs(req: Request, res: Response) {
    try {
      const { search, action } = req.query;
      const logs = await adminService.getActivityLogs(search as string, action as string);
      res.json({ success: true, data: logs, count: logs.length, message: 'Logs carregados com sucesso' });
    } catch (error: any) {
      logger.error(`Erro ao buscar logs: ${error.message}`);
      res.status(500).json({ success: false, message: 'Erro ao carregar logs' });
    }
  }

  /** POST /api/admin/logs */
  async createLog(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || null;
      const { action, details } = req.body;
      await adminService.createActivityLog(userId, action, details);
      res.json({ success: true, message: 'Log criado com sucesso' });
    } catch (error: any) {
      logger.error(`Erro ao criar log: ${error.message}`);
      res.status(500).json({ success: false, message: 'Erro ao criar log' });
    }
  }

  /** GET /api/admin/reports */
  async getReports(req: Request, res: Response) {
    try {
      const reports = await adminService.getReports();
      res.json({ success: true, message: 'Relatórios carregados com sucesso', data: reports });
    } catch (error: any) {
      logger.error(`Erro ao gerar relatórios: ${error.message}`);
      res.status(500).json({ success: false, message: error.message || 'Erro ao gerar relatórios' });
    }
  }
}

export const adminController = new AdminController();
