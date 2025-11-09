"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/modules/benefits/benefit.routes.ts
const express_1 = require("express");
const benefit_controller_1 = require("./benefit.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const router = (0, express_1.Router)();
const controller = new benefit_controller_1.BenefitController();
router.use(auth_middleware_1.verifyTokenMiddleware);
router.get('/', controller.list.bind(controller));
router.get('/level/:levelId', controller.getByLevel.bind(controller));
router.get('/user/:userId?', controller.getUserBenefits.bind(controller));
router.post('/', (0, role_middleware_1.requireRoles)('admin'), controller.create.bind(controller));
router.put('/:id', (0, role_middleware_1.requireRoles)('admin'), controller.update.bind(controller));
router.delete('/:id', (0, role_middleware_1.requireRoles)('admin'), controller.remove.bind(controller));
exports.default = router;
