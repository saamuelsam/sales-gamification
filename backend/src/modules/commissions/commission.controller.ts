// backend/src/modules/commissions/commission.controller.ts
import { Request, Response } from 'express';
import { CommissionService } from './commission.service';
import { ApiResponse } from '@utils/responses';

const commissionService = new CommissionService();

export class CommissionController {
  async getUserCommissions(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }
      const commissions = await commissionService.getUserCommissions(userId);
      return ApiResponse.success(res, commissions, 'Comissões do usuário');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno';
      return ApiResponse.error(res, message, 500);
    }
  }

  async getSummary(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }
      const summary = await commissionService.getUserCommissionsSummary(userId);
      return ApiResponse.success(res, summary, 'Resumo de comissões');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno';
      return ApiResponse.error(res, message, 500);
    }
  }

  async markAsPaid(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return ApiResponse.error(res, 'ID da comissão é obrigatório', 400);
      }
      const commission = await commissionService.markAsPaid(id);
      return ApiResponse.success(res, commission, 'Comissão marcada como paga');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno';
      return ApiResponse.error(res, message, 500);
    }
  }

  async getReport(req: Request, res: Response) {
    try {
      const report = await commissionService.getCommissionsReport(req.query);
      return ApiResponse.success(res, report, 'Relatório de comissões');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno';
      return ApiResponse.error(res, message, 500);
    }
  }
}
