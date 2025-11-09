"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/modules/commissions/commission.routes.ts
const express_1 = require("express");
const commission_controller_1 = require("./commission.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// ✅ Minhas comissões de rede (EXISTE)
router.get('/network', auth_middleware_1.verifyTokenMiddleware, (req, res, next) => commission_controller_1.commissionController.getNetworkCommissions(req, res).catch(next));
// ✅ Resumo consolidado (EXISTE)
router.get('/summary', auth_middleware_1.verifyTokenMiddleware, (req, res, next) => commission_controller_1.commissionController.getSummary(req, res).catch(next));
// ✅ Marcar comissão como paga (EXISTE)
router.put('/:commissionId/mark-paid', auth_middleware_1.verifyTokenMiddleware, (req, res, next) => commission_controller_1.commissionController.markAsPaid(req, res).catch(next));
// ✅ Relatório (EXISTE)
router.get('/report', auth_middleware_1.verifyTokenMiddleware, (req, res, next) => commission_controller_1.commissionController.getReport(req, res).catch(next));
// ✅ Exportar CSV (EXISTE)
router.get('/export/csv', auth_middleware_1.verifyTokenMiddleware, (req, res, next) => commission_controller_1.commissionController.exportCSV(req, res).catch(next));
router.get('/monthly', auth_middleware_1.verifyTokenMiddleware, (req, res, next) => commission_controller_1.commissionController.getMonthlyNetworkCommissions(req, res).catch(next));
exports.default = router;
