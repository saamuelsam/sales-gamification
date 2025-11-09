"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/modules/points/points.routes.ts
const express_1 = require("express");
const points_controller_1 = require("./points.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
const controller = new points_controller_1.PointsController();
router.use(auth_middleware_1.verifyTokenMiddleware);
router.get('/history/:userId?', controller.getHistory.bind(controller));
router.get('/total/:userId?', controller.getTotal.bind(controller));
router.get('/ranking', controller.getRanking.bind(controller));
router.get('/progress/:userId?', controller.getProgress.bind(controller));
exports.default = router;
