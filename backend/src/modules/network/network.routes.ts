// backend/src/modules/network/network.routes.ts
import { Router } from 'express';
import { networkController } from './network.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// ✅ Rota para listar vendas da equipe
router.get('/team-sales', verifyTokenMiddleware, (req, res, next) =>
  networkController.getTeamSalesWithStatus(req, res).catch(next)
);

// ✅ Rota para resumo de comissões
router.get('/commissions-summary', verifyTokenMiddleware, (req, res, next) =>
  networkController.getNetworkCommissionsSummary(req, res).catch(next)
);

export default router;
