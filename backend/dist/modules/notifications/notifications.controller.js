"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsController = exports.NotificationsController = void 0;
const notifications_service_1 = require("./notifications.service");
const responses_1 = require("../../utils/responses");
class NotificationsController {
    // ✅ CREATE - Criar notificação
    async create(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Não autenticado', 401);
            }
            const { type, title, message, metadata } = req.body;
            if (!type || !title || !message) {
                return responses_1.ApiResponse.error(res, 'type, title e message são obrigatórios', 400);
            }
            const notification = await notifications_service_1.notificationsService.create(userId, {
                type,
                title,
                message,
                metadata,
            });
            return responses_1.ApiResponse.created(res, notification, 'Notificação criada com sucesso');
        }
        catch (error) {
            console.error('❌ Erro ao criar notificação:', error);
            return responses_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // ✅ LIST - Listar notificações
    async list(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Não autenticado', 401);
            }
            const limit = parseInt(req.query.limit) || 20;
            const offset = parseInt(req.query.offset) || 0;
            const notifications = await notifications_service_1.notificationsService.list(userId, limit, offset);
            return responses_1.ApiResponse.success(res, notifications, 'Notificações carregadas');
        }
        catch (error) {
            console.error('❌ Erro no list:', error);
            return responses_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // ✅ GET UNREAD COUNT
    async getUnreadCount(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Não autenticado', 401);
            }
            const count = await notifications_service_1.notificationsService.getUnreadCount(userId);
            return responses_1.ApiResponse.success(res, { count });
        }
        catch (error) {
            console.error('❌ Erro no getUnreadCount:', error);
            return responses_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // ✅ MARK AS READ
    async markAsRead(req, res) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Não autenticado', 401);
            }
            await notifications_service_1.notificationsService.markAsRead(id, userId);
            return responses_1.ApiResponse.success(res, null, 'Notificação marcada como lida');
        }
        catch (error) {
            console.error('❌ Erro no markAsRead:', error);
            return responses_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // ✅ MARK ALL AS READ
    async markAllAsRead(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Não autenticado', 401);
            }
            await notifications_service_1.notificationsService.markAllAsRead(userId);
            return responses_1.ApiResponse.success(res, null, 'Todas notificações marcadas como lidas');
        }
        catch (error) {
            console.error('❌ Erro no markAllAsRead:', error);
            return responses_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // ✅ DELETE
    async delete(req, res) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Não autenticado', 401);
            }
            await notifications_service_1.notificationsService.delete(id, userId);
            return responses_1.ApiResponse.success(res, null, 'Notificação excluída');
        }
        catch (error) {
            console.error('❌ Erro no delete:', error);
            return responses_1.ApiResponse.error(res, error.message, 500);
        }
    }
}
exports.NotificationsController = NotificationsController;
exports.notificationsController = new NotificationsController();
