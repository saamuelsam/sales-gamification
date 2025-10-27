// backend/src/modules/commissions/commission.controller.ts

import { Request, Response } from 'express';
import { CommissionService } from './commission.service';
import { ApiResponse } from '@utils/responses';

const commissionService = new CommissionService();

export class CommissionController {
  async getUserCommissions(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.user.userId;
      const commissions = await commissionService.getUserCommissions(userId);
      return ApiResponse.success(res, commissions, 'Comissões do usuário');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getSummary(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.user.userId;
      const summary = await commissionService.getUserCommissionsSummary(userId);
      return ApiResponse.success(res, summary, 'Resumo de comissões');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async markAsPaid(req: Request, res: Response) {
    try {
      const commission = await commissionService.markAsPaid(req.params.id);
      return ApiResponse.success(res, commission, 'Comissão marcada como paga');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getReport(req: Request, res: Response) {
    try {
      const report = await commissionService.getCommissionsReport(req.query);
      return ApiResponse.success(res, report, 'Relatório de comissões');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}
