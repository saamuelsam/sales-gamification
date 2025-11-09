"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionController = void 0;
const commission_service_1 = require("./commission.service");
const logger_1 = require("../../utils/logger");
class CommissionController {
    /**
     * ✅ GET /api/commissions/network
     * Listar todas as comissões do líder
     */
    async getNetworkCommissions(req, res) {
        try {
            const leaderId = req.user?.userId;
            if (!leaderId) {
                logger_1.logger.warn('❌ Sem autenticação em getNetworkCommissions');
                return res.status(401).json({
                    success: false,
                    message: 'Usuário não autenticado'
                });
            }
            logger_1.logger.info(`📋 Buscando comissões para líder: ${leaderId}`);
            const commissions = await commission_service_1.commissionService.getNetworkCommissions(leaderId);
            return res.json({
                success: true,
                data: commissions,
                count: commissions.length,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro em getNetworkCommissions: ${error.message}`);
            logger_1.logger.error(`Stack: ${error.stack}`);
            return res.status(500).json({
                success: false,
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
    /**
     * ✅ GET /api/commissions/summary
     * Resumo completo de comissões
     */
    async getSummary(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                logger_1.logger.warn('❌ Sem autenticação em getSummary');
                return res.status(401).json({
                    success: false,
                    message: 'Usuário não autenticado'
                });
            }
            logger_1.logger.info(`📊 Buscando resumo para usuário: ${userId}`);
            const summary = await commission_service_1.commissionService.getCompleteCommissionsSummary(userId);
            return res.json({
                success: true,
                data: summary,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro em getSummary: ${error.message}`);
            logger_1.logger.error(`Stack: ${error.stack}`);
            return res.status(500).json({
                success: false,
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
    /**
     * ✅ GET /api/commissions/monthly
     * Comissões agrupadas por mês (últimos 6 meses) - PARA O GRÁFICO
     */
    async getMonthlyNetworkCommissions(req, res) {
        try {
            const leaderId = req.user?.userId;
            if (!leaderId) {
                logger_1.logger.warn('❌ Sem autenticação em getMonthlyNetworkCommissions');
                return res.status(401).json({
                    success: false,
                    message: 'Não autenticado'
                });
            }
            logger_1.logger.info(`📊 Buscando comissões mensais para líder: ${leaderId}`);
            const data = await commission_service_1.commissionService.getMonthlyNetworkCommissions(leaderId);
            return res.json({
                success: true,
                data,
                count: data.length,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro em getMonthlyNetworkCommissions: ${error.message}`);
            logger_1.logger.error(`Stack: ${error.stack}`);
            return res.status(500).json({
                success: false,
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
    /**
     * ✅ PATCH /api/commissions/:commissionId/mark-paid
     * Marcar comissão como paga
     */
    async markAsPaid(req, res) {
        try {
            const { commissionId } = req.params;
            const leaderId = req.user?.userId;
            if (!leaderId) {
                logger_1.logger.warn('❌ Sem autenticação em markAsPaid');
                return res.status(401).json({
                    success: false,
                    message: 'Usuário não autenticado'
                });
            }
            if (!commissionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Commission ID é obrigatório'
                });
            }
            logger_1.logger.info(`✅ Marcando ${commissionId} como paga para ${leaderId}`);
            const result = await commission_service_1.commissionService.markNetworkCommissionAsPaid(commissionId, leaderId);
            return res.json({
                success: true,
                data: result,
                message: 'Comissão marcada como paga',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro em markAsPaid: ${error.message}`);
            logger_1.logger.error(`Stack: ${error.stack}`);
            return res.status(500).json({
                success: false,
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
    /**
     * ✅ GET /api/commissions/report
     * Relatório consolidado (admin)
     */
    async getReport(req, res) {
        try {
            logger_1.logger.info(`📈 Gerando relatório consolidado`);
            const report = await commission_service_1.commissionService.getConsolidatedCommissionsReport();
            return res.json({
                success: true,
                data: report,
                count: report.length,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro em getReport: ${error.message}`);
            logger_1.logger.error(`Stack: ${error.stack}`);
            return res.status(500).json({
                success: false,
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
    /**
     * ✅ GET /api/commissions/export/csv
     * Exportar comissões para CSV
     */
    async exportCSV(req, res) {
        try {
            logger_1.logger.info(`📥 Exportando comissões para CSV`);
            const { headers, rows } = await commission_service_1.commissionService.exportCommissionsCSV();
            // Criar CSV
            const csv = [
                headers.join(','),
                ...rows.map((row) => row.map(cell => `"${cell}"`).join(',')),
            ].join('\n');
            // Headers para download
            res.header('Content-Type', 'text/csv; charset=utf-8');
            res.header('Content-Disposition', 'attachment; filename=comissoes.csv');
            // BOM para Excel reconhecer UTF-8
            return res.send('\uFEFF' + csv);
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro em exportCSV: ${error.message}`);
            logger_1.logger.error(`Stack: ${error.stack}`);
            return res.status(500).json({
                success: false,
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
    /**
     * ✅ GET /api/commissions/stats
     * Estatísticas gerais do sistema
     */
    async getStats(req, res) {
        try {
            logger_1.logger.info(`📊 Buscando estatísticas gerais de comissões`);
            const stats = await commission_service_1.commissionService.getCommissionsStats();
            return res.json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro em getStats: ${error.message}`);
            logger_1.logger.error(`Stack: ${error.stack}`);
            return res.status(500).json({
                success: false,
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
}
exports.commissionController = new CommissionController();
