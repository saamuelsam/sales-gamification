"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/modules/dashboard/dashboard.routes.ts
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
const controller = new dashboard_controller_1.DashboardController();
router.use(auth_middleware_1.verifyTokenMiddleware);
router.get('/personal', controller.getPersonal.bind(controller));
router.get('/team', controller.getTeam.bind(controller));
router.get('/complete', controller.getComplete.bind(controller));
router.get('/admin', controller.getAdmin.bind(controller));
exports.default = router;
