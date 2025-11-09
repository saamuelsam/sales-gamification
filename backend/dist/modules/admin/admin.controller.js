"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
const logger_1 = require("../../utils/logger");
class AdminController {
    /** GET /api/admin/dashboard */
    async getDashboard(req, res) {
        try {
            const stats = await admin_service_1.adminService.getDashboardStats();
            res.json({ success: true, data: stats, message: 'Estatísticas carregadas com sucesso' });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao buscar estatísticas: ${error.message}`);
            res.status(500).json({ success: false, message: 'Erro ao carregar estatísticas' });
        }
    }
    /** GET /api/admin/users */
    async getUsers(req, res) {
        try {
            const users = await admin_service_1.adminService.getAllUsers();
            res.json({ success: true, data: users, count: users.length, message: 'Usuários carregados com sucesso' });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao buscar usuários: ${error.message}`);
            res.status(500).json({ success: false, message: 'Erro ao carregar usuários' });
        }
    }
    /** PATCH /api/admin/users/:id/status */
    async toggleUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;
            const adminId = req.user?.userId;
            if (typeof is_active !== 'boolean') {
                return res.status(400).json({ success: false, message: 'O campo is_active deve ser um booleano' });
            }
            await admin_service_1.adminService.updateUserStatus(id, is_active, adminId);
            res.json({ success: true, message: `Usuário ${is_active ? 'ativado' : 'desativado'} com sucesso` });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao atualizar status: ${error.message}`);
            res.status(500).json({ success: false, message: error.message || 'Erro ao atualizar status do usuário' });
        }
    }
    /** PATCH /api/admin/users/:id/role */
    async updateUserRole(req, res) {
        try {
            const { id } = req.params;
            const { role } = req.body;
            const adminId = req.user?.userId;
            const validRoles = ['consultant', 'master_consultant', 'senior_consultant', 'prime_consultant', 'executive', 'admin', 'ceo'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ success: false, message: 'Função inválida' });
            }
            await admin_service_1.adminService.updateUserRole(id, role, adminId);
            res.json({ success: true, message: 'Função atualizada com sucesso' });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao atualizar função: ${error.message}`);
            res.status(500).json({ success: false, message: error.message || 'Erro ao atualizar função do usuário' });
        }
    }
    /** GET /api/admin/teams */
    async getTeams(req, res) {
        try {
            const teams = await admin_service_1.adminService.getTeamsSummary();
            res.json({ success: true, data: teams, count: teams.length, message: 'Equipes carregadas com sucesso' });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao buscar equipes: ${error.message}`);
            res.status(500).json({ success: false, message: 'Erro ao carregar equipes' });
        }
    }
    /** GET /api/admin/commissions */
    async getAllCommissions(req, res) {
        try {
            const { status, search } = req.query;
            const commissions = await admin_service_1.adminService.getAllCommissions(status, search);
            res.json({
                success: true,
                data: commissions,
                count: commissions.length,
                message: 'Comissões carregadas com sucesso'
            });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao buscar comissões: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Erro ao carregar comissões'
            });
        }
    }
    /** PATCH /api/admin/commissions/:id/paid */
    async markCommissionAsPaid(req, res) {
        try {
            const { id } = req.params;
            const adminId = req.user?.userId;
            await admin_service_1.adminService.markCommissionAsPaid(id, adminId);
            res.json({
                success: true,
                message: 'Comissão marcada como paga com sucesso'
            });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao marcar comissão como paga: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message || 'Erro ao marcar comissão como paga'
            });
        }
    }
    /** GET /api/admin/commissions/export */
    async exportCommissionsCSV(req, res) {
        try {
            const csv = await admin_service_1.adminService.exportCommissionsCSV();
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=commissions.csv');
            res.send(csv);
        }
        catch (error) {
            logger_1.logger.error(`Erro ao exportar CSV: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Erro ao exportar comissões'
            });
        }
    }
    /** GET /api/admin/config */
    async getConfig(req, res) {
        try {
            const config = await admin_service_1.adminService.getSystemConfig();
            res.json({ success: true, data: config, message: 'Configurações carregadas com sucesso' });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao buscar configurações: ${error.message}`);
            res.status(500).json({ success: false, message: 'Erro ao carregar configurações' });
        }
    }
    /** PATCH /api/admin/config */
    async updateConfig(req, res) {
        try {
            const adminId = req.user?.userId;
            const config = await admin_service_1.adminService.updateSystemConfig(req.body, adminId);
            res.json({ success: true, data: config, message: 'Configurações atualizadas com sucesso' });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao atualizar configurações: ${error.message}`);
            res.status(500).json({ success: false, message: 'Erro ao atualizar configurações' });
        }
    }
    /** GET /api/admin/notifications */
    async getNotifications(req, res) {
        try {
            const notifications = await admin_service_1.adminService.getAllNotifications();
            res.json({ success: true, data: notifications, count: notifications.length, message: 'Notificações carregadas com sucesso' });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao buscar notificações: ${error.message}`);
            res.status(500).json({ success: false, message: 'Erro ao carregar notificações' });
        }
    }
    /** POST /api/admin/notifications */
    async createNotification(req, res) {
        try {
            const { title, message, type, target } = req.body;
            const adminId = req.user?.userId;
            if (!title || !message || !type) {
                return res.status(400).json({ success: false, message: 'Campos obrigatórios: title, message, type' });
            }
            const result = await admin_service_1.adminService.createGlobalNotification(title, message, type, target || 'all', adminId);
            res.json({ success: true, data: result, message: `Notificação enviada para ${result.count} usuários` });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao criar notificação: ${error.message}`);
            res.status(500).json({ success: false, message: 'Erro ao criar notificação' });
        }
    }
    /** DELETE /api/admin/notifications/:id */
    async deleteNotification(req, res) {
        try {
            const { id } = req.params;
            await admin_service_1.adminService.deleteNotification(id);
            res.json({ success: true, message: 'Notificação deletada com sucesso' });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao deletar notificação: ${error.message}`);
            res.status(500).json({ success: false, message: 'Erro ao deletar notificação' });
        }
    }
    /** GET /api/admin/logs */
    async getLogs(req, res) {
        try {
            const { search, action } = req.query;
            const logs = await admin_service_1.adminService.getActivityLogs(search, action);
            res.json({ success: true, data: logs, count: logs.length, message: 'Logs carregados com sucesso' });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao buscar logs: ${error.message}`);
            res.status(500).json({ success: false, message: 'Erro ao carregar logs' });
        }
    }
    /** POST /api/admin/logs */
    async createLog(req, res) {
        try {
            const userId = req.user?.userId || null;
            const { action, details } = req.body;
            await admin_service_1.adminService.createActivityLog(userId, action, details);
            res.json({ success: true, message: 'Log criado com sucesso' });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao criar log: ${error.message}`);
            res.status(500).json({ success: false, message: 'Erro ao criar log' });
        }
    }
    /** GET /api/admin/reports */
    async getReports(req, res) {
        try {
            const reports = await admin_service_1.adminService.getReports();
            res.json({ success: true, message: 'Relatórios carregados com sucesso', data: reports });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao gerar relatórios: ${error.message}`);
            res.status(500).json({ success: false, message: error.message || 'Erro ao gerar relatórios' });
        }
    }
}
exports.AdminController = AdminController;
exports.adminController = new AdminController();
