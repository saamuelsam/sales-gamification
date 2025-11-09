"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_controller_1 = require("./notifications.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyTokenMiddleware);
// ✅ GET - Listar notificações
router.get('/', (req, res) => notifications_controller_1.notificationsController.list(req, res));
// ✅ GET - Contar não lidas
router.get('/unread-count', (req, res) => notifications_controller_1.notificationsController.getUnreadCount(req, res));
// ✅ POST - CRIAR notificação (NOVO!)
router.post('/', (req, res) => notifications_controller_1.notificationsController.create?.(req, res));
// ✅ PUT - Marcar como lida
router.put('/:id/read', (req, res) => notifications_controller_1.notificationsController.markAsRead(req, res));
// ✅ PUT - Marcar todas como lidas
router.put('/mark-all-read', (req, res) => notifications_controller_1.notificationsController.markAllAsRead(req, res));
// ✅ DELETE - Deletar notificação
router.delete('/:id', (req, res) => notifications_controller_1.notificationsController.delete(req, res));
exports.default = router;
