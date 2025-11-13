import { Request, Response } from 'express';
import { commissionService } from './commission.service';
import { ApiResponse } from '../../utils/responses';

class CommissionController {
  /**
   * 🔹 Retorna resumo geral de comissões (pessoal + rede)
   */
  async getSummary(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

    const data = await commissionService.getCombinedSummary(userId);
    return ApiResponse.success(res, data, 'Resumo de comissões carregado com sucesso');
  }

  /**
   * 🔹 Retorna todas as comissões pessoais do usuário
   */
  async getPersonalCommissions(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

    const data = await commissionService.getPersonalCommissions(userId);
    return ApiResponse.success(res, data, 'Comissões pessoais carregadas');
  }

  /**
   * 🔹 Retorna todas as comissões de rede (líder)
   */
  async getNetworkCommissions(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

    const data = await commissionService.getNetworkCommissions(userId);
    return ApiResponse.success(res, data, 'Comissões de rede carregadas');
  }

  /**
   * 🔹 Retorna resumo mensal (últimos 6 meses)
   */
  async getMonthly(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

    const data = await commissionService.getMonthlySummary(userId);
    return ApiResponse.success(res, data, 'Resumo mensal carregado');
  }
}

export const commissionController = new CommissionController();
