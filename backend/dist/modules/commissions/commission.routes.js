"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const commission_controller_1 = require("./commission.controller");
const router = (0, express_1.Router)();
/**
 * 🔹 Rotas de comissões
 */
router.get('/summary', auth_middleware_1.verifyTokenMiddleware, (req, res, next) => commission_controller_1.commissionController.getSummary(req, res).catch(next));
router.get('/personal', auth_middleware_1.verifyTokenMiddleware, (req, res, next) => commission_controller_1.commissionController.getPersonalCommissions(req, res).catch(next));
router.get('/network', auth_middleware_1.verifyTokenMiddleware, (req, res, next) => commission_controller_1.commissionController.getNetworkCommissions(req, res).catch(next));
router.get('/monthly', auth_middleware_1.verifyTokenMiddleware, (req, res, next) => commission_controller_1.commissionController.getMonthly(req, res).catch(next));
exports.default = router;
