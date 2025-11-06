// backend/src/modules/commissions/commission.controller.ts
import { Request, Response } from 'express';
import { commissionService } from './commission.service';
import { logger } from '../../utils/logger';

class CommissionController {
  async getNetworkCommissions(req: Request, res: Response) {
    try {
      const leaderId = req.user?.userId;
      
      if (!leaderId) {
        logger.warn('❌ Sem autenticação em getNetworkCommissions');
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      logger.info(`📋 Buscando comissões para líder: ${leaderId}`);
      const commissions = await commissionService.getNetworkCommissions(leaderId);
      
      return res.json({ 
        success: true, 
        data: commissions,
        count: commissions.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error(`❌ Erro em getNetworkCommissions: ${error.message}`);
      logger.error(`Stack: ${error.stack}`);
      
      return res.status(500).json({ 
        success: false, 
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  async getSummary(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        logger.warn('❌ Sem autenticação em getSummary');
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      logger.info(`📊 Buscando resumo para usuário: ${userId}`);
      const summary = await commissionService.getCompleteCommissionsSummary(userId);
      
      return res.json({ 
        success: true, 
        data: summary,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error(`❌ Erro em getSummary: ${error.message}`);
      logger.error(`Stack: ${error.stack}`);
      
      return res.status(500).json({ 
        success: false, 
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  async markAsPaid(req: Request, res: Response) {
    try {
      const { commissionId } = req.params;
      const leaderId = req.user?.userId;

      if (!leaderId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }

      if (!commissionId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Commission ID é obrigatório' 
        });
      }

      logger.info(`✅ Marcando ${commissionId} como paga para ${leaderId}`);
      const result = await commissionService.markNetworkCommissionAsPaid(
        commissionId,
        leaderId
      );

      return res.json({ 
        success: true, 
        data: result, 
        message: 'Comissão marcada como paga',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error(`❌ Erro em markAsPaid: ${error.message}`);
      logger.error(`Stack: ${error.stack}`);
      
      return res.status(500).json({ 
        success: false, 
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  async getReport(req: Request, res: Response) {
    try {
      logger.info(`📈 Gerando relatório consolidado`);
      const report = await commissionService.getConsolidatedCommissionsReport();

      return res.json({ 
        success: true, 
        data: report,
        count: report.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error(`❌ Erro em getReport: ${error.message}`);
      logger.error(`Stack: ${error.stack}`);
      
      return res.status(500).json({ 
        success: false, 
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  async exportCSV(req: Request, res: Response) {
    try {
      logger.info(`📥 Exportando comissões para CSV`);
      const { headers, rows } = await commissionService.exportCommissionsCSV();

      // Criar CSV
      const csv = [
        headers.join(','),
        ...rows.map((row: any[]) => 
          row.map(cell => `"${cell}"`).join(',')
        ),
      ].join('\n');

      res.header('Content-Type', 'text/csv; charset=utf-8');
      res.header('Content-Disposition', 'attachment; filename=comissoes.csv');
      return res.send('\uFEFF' + csv);
    } catch (error: any) {
      logger.error(`❌ Erro em exportCSV: ${error.message}`);
      logger.error(`Stack: ${error.stack}`);
      
      return res.status(500).json({ 
        success: false, 
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

export const commissionController = new CommissionController();
