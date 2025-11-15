// backend/src/modules/ceo/ceo.controller.ts
import { Request, Response } from 'express';
import { ceoService } from './ceo.service';
import { ApiResponse } from '../../utils/responses';

/**
 * 🔐 CEO Controller - Endpoints para gestão completa do sistema
 */
export class CeoController {
  
  /**
   * GET /api/ceo/consultants
   * Lista todos os consultores com filtros
   */
  async getAllConsultants(req: Request, res: Response) {
    try {
      const { role, search, active } = req.query;
      
      const filters = {
        role: role as string,
        search: search as string,
        active: active === 'true' ? true : active === 'false' ? false : undefined,
      };

      const consultants = await ceoService.getAllConsultants(filters);
      
      return ApiResponse.success(
        res,
        consultants,
        `${consultants.length} consultores encontrados`
      );
    } catch (error: any) {
      console.error('❌ Erro ao buscar consultores:', error);
      return ApiResponse.error(res, error.message || 'Erro ao buscar consultores', 500);
    }
  }

  /**
   * GET /api/ceo/consultants/:id
   * Detalhes completos de um consultor
   */
  async getConsultantDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const details = await ceoService.getConsultantDetails(id);
      
      return ApiResponse.success(res, details, 'Detalhes carregados');
    } catch (error: any) {
      console.error('❌ Erro ao buscar detalhes:', error);
      return ApiResponse.error(res, error.message || 'Erro ao buscar detalhes', 500);
    }
  }

  /**
   * PUT /api/ceo/consultants/:id
   * Editar dados do consultor
   */
  async updateConsultant(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ceoId = req.user?.userId;
      
      if (!ceoId) {
        return ApiResponse.error(res, 'CEO não identificado', 401);
      }

      const updatedUser = await ceoService.updateConsultant(id, req.body, ceoId);
      
      return ApiResponse.success(res, updatedUser, 'Consultor atualizado com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar consultor:', error);
      return ApiResponse.error(res, error.message || 'Erro ao atualizar consultor', 500);
    }
  }

  /**
   * PATCH /api/ceo/consultants/:id/role
   * Mudar cargo do consultor
   */
  async changeRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const ceoId = req.user?.userId;
      
      if (!ceoId) {
        return ApiResponse.error(res, 'CEO não identificado', 401);
      }

      if (!role) {
        return ApiResponse.error(res, 'Novo cargo é obrigatório', 400);
      }

      const result = await ceoService.changeConsultantRole(id, role, ceoId);
      
      return ApiResponse.success(res, result, result.message);
    } catch (error: any) {
      console.error('❌ Erro ao mudar cargo:', error);
      return ApiResponse.error(res, error.message || 'Erro ao mudar cargo', 500);
    }
  }

  /**
   * PATCH /api/ceo/consultants/:id/points
   * Ajustar pontos do consultor
   */
  async adjustPoints(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { points, reason } = req.body;
      const ceoId = req.user?.userId;
      
      if (!ceoId) {
        return ApiResponse.error(res, 'CEO não identificado', 401);
      }

      if (points === undefined || !reason) {
        return ApiResponse.error(res, 'Pontos e motivo são obrigatórios', 400);
      }

      const result = await ceoService.adjustPoints(id, points, reason, ceoId);
      
      return ApiResponse.success(res, result, result.message);
    } catch (error: any) {
      console.error('❌ Erro ao ajustar pontos:', error);
      return ApiResponse.error(res, error.message || 'Erro ao ajustar pontos', 500);
    }
  }

  /**
   * POST /api/ceo/consultants/:id/sales
   * Criar venda para um consultor
   */
  async createSale(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ceoId = req.user?.userId;
      
      if (!ceoId) {
        return ApiResponse.error(res, 'CEO não identificado', 401);
      }

      const { client_id, value, kilowatts, status, description } = req.body;

      if (!client_id || !value || !kilowatts) {
        return ApiResponse.error(res, 'Dados da venda incompletos', 400);
      }

      const sale = await ceoService.createSaleForConsultant(
        id,
        { client_id, value, kilowatts, status, description },
        ceoId
      );
      
      return ApiResponse.success(res, sale, 'Venda criada com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao criar venda:', error);
      return ApiResponse.error(res, error.message || 'Erro ao criar venda', 500);
    }
  }

  /**
   * PATCH /api/ceo/consultants/:id/toggle-status
   * Ativar/Desativar consultor
   */
  async toggleStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ceoId = req.user?.userId;
      
      if (!ceoId) {
        return ApiResponse.error(res, 'CEO não identificado', 401);
      }

      const result = await ceoService.toggleConsultantStatus(id, ceoId);
      
      return ApiResponse.success(res, result, result.message);
    } catch (error: any) {
      console.error('❌ Erro ao alterar status:', error);
      return ApiResponse.error(res, error.message || 'Erro ao alterar status', 500);
    }
  }

  /**
   * PATCH /api/ceo/consultants/:id/transfer
   * Transferir consultor para outro patrocinador
   */
  async transferConsultant(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { newParentId } = req.body;
      const ceoId = req.user?.userId;
      
      if (!ceoId) {
        return ApiResponse.error(res, 'CEO não identificado', 401);
      }

      if (!newParentId) {
        return ApiResponse.error(res, 'ID do novo patrocinador é obrigatório', 400);
      }

      const result = await ceoService.transferConsultant(id, newParentId, ceoId);
      
      return ApiResponse.success(res, result, result.message);
    } catch (error: any) {
      console.error('❌ Erro ao transferir consultor:', error);
      return ApiResponse.error(res, error.message || 'Erro ao transferir consultor', 500);
    }
  }

  /**
   * GET /api/ceo/activity-logs
   * Histórico de ações do CEO
   */
  async getActivityLogs(req: Request, res: Response) {
    try {
      const { startDate, endDate, action } = req.query;
      
      const filters = {
        startDate: startDate as string,
        endDate: endDate as string,
        action: action as string,
      };

      const logs = await ceoService.getCeoActivityLogs(filters);
      
      return ApiResponse.success(res, logs, `${logs.length} registros encontrados`);
    } catch (error: any) {
      console.error('❌ Erro ao buscar logs:', error);
      return ApiResponse.error(res, error.message || 'Erro ao buscar logs', 500);
    }
  }

  /**
   * POST /api/ceo/consultants/:id/reset-password
   * Resetar senha de um consultor
   */
  async resetPassword(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const ceoId = req.user?.userId;
      
      if (!ceoId) {
        return ApiResponse.error(res, 'CEO não identificado', 401);
      }

      if (!newPassword || newPassword.length < 6) {
        return ApiResponse.error(res, 'Senha deve ter no mínimo 6 caracteres', 400);
      }

      const result = await ceoService.resetConsultantPassword(id, newPassword, ceoId);
      
      return ApiResponse.success(res, result, result.message);
    } catch (error: any) {
      console.error('❌ Erro ao resetar senha:', error);
      return ApiResponse.error(res, error.message || 'Erro ao resetar senha', 500);
    }
  }
}

export const ceoController = new CeoController();
