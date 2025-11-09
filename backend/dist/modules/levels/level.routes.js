"use strict";
// backend/src/modules/levels/level.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const level_controller_1 = require("./level.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const router = (0, express_1.Router)();
// ============ AUTENTICADO (ESPECÍFICAS PRIMEIRO!) ============
router.get('/goals/my-goals', auth_middleware_1.verifyTokenMiddleware, level_controller_1.levelController.getUserGoals.bind(level_controller_1.levelController));
router.get('/pathway/user-pathway', auth_middleware_1.verifyTokenMiddleware, level_controller_1.levelController.getLevelPathway.bind(level_controller_1.levelController));
router.get('/by-points/:points', auth_middleware_1.verifyTokenMiddleware, level_controller_1.levelController.findByPoints.bind(level_controller_1.levelController));
// ============ PÚBLICO ============
router.get('/', level_controller_1.levelController.list.bind(level_controller_1.levelController));
// ============ ESPECÍFICO POR ID ============
router.get('/:id', auth_middleware_1.verifyTokenMiddleware, level_controller_1.levelController.find.bind(level_controller_1.levelController));
// ============ ADMIN ============
router.post('/', auth_middleware_1.verifyTokenMiddleware, (0, role_middleware_1.requireRoles)('admin'), level_controller_1.levelController.create.bind(level_controller_1.levelController));
router.put('/:id', auth_middleware_1.verifyTokenMiddleware, (0, role_middleware_1.requireRoles)('admin'), level_controller_1.levelController.update.bind(level_controller_1.levelController));
router.delete('/:id', auth_middleware_1.verifyTokenMiddleware, (0, role_middleware_1.requireRoles)('admin'), level_controller_1.levelController.delete.bind(level_controller_1.levelController));
exports.default = router;
