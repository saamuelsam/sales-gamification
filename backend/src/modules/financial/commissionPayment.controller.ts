import { Request, Response } from 'express';
import { CommissionPaymentService } from './commissionPayment.service';
import { logger } from '../../utils/logger';

export class CommissionPaymentController {
  private service: CommissionPaymentService;

  constructor() {
    this.service = new CommissionPaymentService();
  }

  // GET /api/commission-payments/pending-users
  async getPendingUsers(req: Request, res: Response): Promise<void> {
    try {
      const pendingCommissions = await this.service.getPendingCommissions();
      
      res.json({
        success: true,
        data: pendingCommissions
      });
    } catch (error: any) {
      logger.error('Erro ao buscar comissões pendentes:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar comissões pendentes',
        error: error.message
      });
    }
  }

  // GET /api/financial/commission-payments/pending
  async getPendingCommissions(req: Request, res: Response): Promise<void> {
    try {
      const pendingCommissions = await this.service.getPendingCommissions();
      
      res.json({
        success: true,
        data: pendingCommissions
      });
    } catch (error: any) {
      logger.error('Erro ao buscar comissões pendentes:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar comissões pendentes',
        error: error.message
      });
    }
  }

  // GET /api/financial/commission-payments/user/:userId/details
  async getUserCommissionDetails(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const details = await this.service.getUserCommissionDetails(userId);
      
      res.json({
        success: true,
        data: details
      });
    } catch (error: any) {
      logger.error('Erro ao buscar detalhes das comissões:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar detalhes das comissões',
        error: error.message
      });
    }
  }

  // POST /api/financial/commission-payments/create
  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const { userId, paymentMethod, notes, commissionIds } = req.body;
      const processedBy = req.user?.id;

      if (!userId || !paymentMethod) {
        res.status(400).json({
          success: false,
          message: 'userId e paymentMethod são obrigatórios'
        });
        return;
      }

      const result = await this.service.createPayment(
        userId,
        processedBy,
        paymentMethod,
        notes,
        commissionIds
      );

      res.json({
        success: true,
        message: 'Pagamento criado com sucesso',
        data: result
      });
    } catch (error: any) {
      logger.error('Erro ao criar pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar pagamento',
        error: error.message
      });
    }
  }

  // PUT /api/financial/commission-payments/:paymentId/confirm
  async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const { transactionId, metadata } = req.body;

      if (!transactionId) {
        res.status(400).json({
          success: false,
          message: 'transactionId é obrigatório'
        });
        return;
      }

      await this.service.confirmPayment(paymentId, transactionId, metadata);

      res.json({
        success: true,
        message: 'Pagamento confirmado com sucesso'
      });
    } catch (error: any) {
      logger.error('Erro ao confirmar pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao confirmar pagamento',
        error: error.message
      });
    }
  }

  // GET /api/financial/commission-payments/history
  async getPaymentHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId, status, startDate, endDate, limit = 50, offset = 0 } = req.query;

      const filters = {
        userId: userId as string | undefined,
        status: status as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      const history = await this.service.getPaymentHistory(filters);

      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      logger.error('Erro ao buscar histórico de pagamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar histórico de pagamentos',
        error: error.message
      });
    }
  }

  // PUT /api/financial/commission-payments/:paymentId/cancel
  async cancelPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Motivo do cancelamento é obrigatório'
        });
        return;
      }

      await this.service.cancelPayment(paymentId, reason);

      res.json({
        success: true,
        message: 'Pagamento cancelado com sucesso'
      });
    } catch (error: any) {
      logger.error('Erro ao cancelar pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao cancelar pagamento',
        error: error.message
      });
    }
  }

  // POST /api/commission-payments/generate-pix-qr
  async generatePixQRCode(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      const pendingUsers = await this.service.getPendingCommissions();
      const userData = pendingUsers.find((u: any) => u.user_id === userId);
      
      if (!userData) {
        res.status(404).json({
          success: false,
          message: 'Usuário não encontrado ou sem comissões pendentes'
        });
        return;
      }
      
      res.json({
        success: true,
        data: {
          qrCode: userData.qr_code_payload,
          pixKey: userData.pix_key,
          amount: userData.total_amount
        }
      });
    } catch (error: any) {
      logger.error('Erro ao gerar QR Code PIX:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar QR Code PIX',
        error: error.message
      });
    }
  }

  // POST /api/commission-payments/process-payment
  async processPayment(req: Request, res: Response): Promise<void> {
    try {
      const { userId, paymentMethod, notes, commissionIds } = req.body;
      const processedBy = req.user?.id;

      const result = await this.service.createPayment(
        userId,
        processedBy,
        paymentMethod,
        notes,
        commissionIds
      );

      res.json({
        success: true,
        message: 'Pagamento processado com sucesso',
        data: result
      });
    } catch (error: any) {
      logger.error('Erro ao processar pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar pagamento',
        error: error.message
      });
    }
  }

  // GET /api/commission-payments/payment/:paymentId
  async getPaymentDetails(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const details = await this.service.getPaymentById(paymentId);
      
      res.json({
        success: true,
        data: details
      });
    } catch (error: any) {
      logger.error('Erro ao buscar detalhes do pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar detalhes do pagamento',
        error: error.message
      });
    }
  }
}
