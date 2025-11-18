// backend/src/modules/financial/financial.controller.ts
import { Request, Response } from 'express';
import { FinancialService } from './financial.service';

const financialService = new FinancialService();

export class FinancialController {
  
  /**
   * GET /financial/pending-sales
   * Listar vendas pendentes
   */
  async getPendingSales(req: Request, res: Response) {
    try {
      const { search, userId, dateFrom, dateTo } = req.query;

      const sales = await financialService.getPendingSales({
        search: search as string,
        userId: userId as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      });

      res.json({
        success: true,
        data: sales,
        count: sales.length,
      });
    } catch (error: any) {
      console.error('❌ Erro ao buscar vendas pendentes:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar vendas pendentes',
        error: error.message,
      });
    }
  }

  /**
   * POST /financial/approve/:saleId
   * Aprovar venda
   */
  async approveSale(req: Request, res: Response) {
    try {
      const { saleId } = req.params;
      const { notes } = req.body;
      const user = (req as any).user;

      // Validar autenticação
      if (!user || !user.userId) {
        console.error('❌ Usuário não autenticado ou sem userId');
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
        });
      }

      console.log('🔍 DEBUG Controller - Aprovando venda:', {
        saleId,
        userId: user.userId,
        userRole: user.role,
        userEmail: user.email,
        notes: notes || 'sem observações'
      });

      const result = await financialService.approveSale(saleId, user.userId, {
        notes,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      });

      res.json(result);
    } catch (error: any) {
      console.error('❌ Erro ao aprovar venda:', error.message);
      console.error('Stack:', error.stack);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao aprovar venda',
      });
    }
  }

  /**
   * POST /financial/reject/:saleId
   * Rejeitar venda
   */
  async rejectSale(req: Request, res: Response) {
    try {
      const { saleId } = req.params;
      const { reason } = req.body;
      const user = (req as any).user;

      // Validar autenticação
      if (!user || !user.userId) {
        console.error('❌ Usuário não autenticado ou sem userId');
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
        });
      }

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'É obrigatório fornecer um motivo para rejeitar a venda',
        });
      }

      console.log('🔍 DEBUG Controller - Rejeitando venda:', {
        saleId,
        userId: user.userId,
        userRole: user.role,
        reasonLength: reason.length
      });

      const result = await financialService.rejectSale(saleId, user.userId, {
        reason,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      });

      res.json(result);
    } catch (error: any) {
      console.error('❌ Erro ao rejeitar venda:', error.message);
      console.error('Stack:', error.stack);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao rejeitar venda',
      });
    }
  }

  /**
   * GET /financial/stats
   * Estatísticas de aprovação
   */
  async getStats(req: Request, res: Response) {
    try {
      const stats = await financialService.getApprovalStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('❌ Erro ao buscar estatísticas:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas',
        error: error.message,
      });
    }
  }

  /**
   * GET /financial/history/:saleId
   * Histórico de aprovações de uma venda
   */
  async getSaleHistory(req: Request, res: Response) {
    try {
      const { saleId } = req.params;

      const history = await financialService.getSaleApprovalHistory(saleId);

      res.json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      console.error('❌ Erro ao buscar histórico:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar histórico',
        error: error.message,
      });
    }
  }
}
