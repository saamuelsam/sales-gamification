"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/modules/clients/clients.routes.ts
const express_1 = require("express");
const clients_controller_1 = require("./clients.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
const controller = new clients_controller_1.ClientsController();
router.use(auth_middleware_1.verifyTokenMiddleware);
router.post('/', controller.create.bind(controller));
router.get('/', controller.list.bind(controller));
router.put('/:id', controller.update.bind(controller));
exports.default = router;
