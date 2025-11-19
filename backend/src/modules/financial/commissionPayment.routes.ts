import { Router } from 'express';
import { CommissionPaymentController } from './commissionPayment.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const controller = new CommissionPaymentController();

// Todas as rotas requerem autenticação
router.use(verifyTokenMiddleware);

// Listar usuários com comissões pendentes
router.get('/pending-users', controller.getPendingUsers.bind(controller));

// Obter detalhes de comissões de um usuário específico
router.get('/user/:userId/details', controller.getUserCommissionDetails.bind(controller));

// Gerar QR Code PIX
router.post('/generate-pix-qr', controller.generatePixQRCode.bind(controller));

// Registrar pagamento
router.post('/process-payment', controller.processPayment.bind(controller));

// Histórico de pagamentos
router.get('/history', controller.getPaymentHistory.bind(controller));

// Obter detalhes de um pagamento específico
router.get('/payment/:paymentId', controller.getPaymentDetails.bind(controller));

export default router;
