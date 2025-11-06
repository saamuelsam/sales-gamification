// backend/src/modules/network/network.controller.ts
import { Request, Response } from 'express';
import { networkService } from './network.service';
import { logger } from '../../utils/logger';

class NetworkController {
  async getTeamSalesWithStatus(req: Request, res: Response) {
    try {
      const leaderId = req.user?.userId;

      if (!leaderId) {
        return res.status(401).json({
          success: false,
          message: 'Não autenticado'
        });
      }

      logger.info(`📊 Buscando vendas da equipe para: ${leaderId}`);
      const sales = await networkService.getTeamSalesWithStatus(leaderId);

      return res.json({
        success: true,
        data: sales,
        count: sales.length
      });
    } catch (error: any) {
      logger.error(`❌ Erro: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ Novo endpoint para resumo
  async getNetworkCommissionsSummary(req: Request, res: Response) {
    try {
      const leaderId = req.user?.userId;

      if (!leaderId) {
        return res.status(401).json({
          success: false,
          message: 'Não autenticado'
        });
      }

      logger.info(`💰 Buscando resumo de comissões para: ${leaderId}`);
      const summary = await networkService.getNetworkCommissionsSummary(leaderId);

      return res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      logger.error(`❌ Erro: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const networkController = new NetworkController();
