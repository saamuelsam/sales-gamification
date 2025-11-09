"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamController = void 0;
const team_service_1 = require("./team.service");
class TeamController {
    async getTeamMembers(req, res) {
        try {
            const leaderId = req.user?.userId;
            if (!leaderId) {
                return res.status(401).json({ success: false, message: 'Não autenticado' });
            }
            const members = await team_service_1.teamService.getTeamMembers(leaderId);
            return res.json({ success: true, data: members });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async addTeamMember(req, res) {
        try {
            const leaderId = req.user?.userId;
            const { email, name } = req.body;
            if (!leaderId) {
                return res.status(401).json({ success: false, message: 'Não autenticado' });
            }
            if (!email || !name) {
                return res.status(400).json({ success: false, message: 'Email e nome são obrigatórios' });
            }
            const member = await team_service_1.teamService.addTeamMember(leaderId, { email, name });
            return res.json({ success: true, data: member, message: 'Membro adicionado com sucesso' });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async removeTeamMember(req, res) {
        try {
            const leaderId = req.user?.userId;
            const { memberId } = req.params;
            if (!leaderId) {
                return res.status(401).json({ success: false, message: 'Não autenticado' });
            }
            await team_service_1.teamService.removeTeamMember(leaderId, memberId);
            return res.json({ success: true, message: 'Membro removido com sucesso' });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async getTeamStats(req, res) {
        try {
            const leaderId = req.user?.userId;
            if (!leaderId) {
                return res.status(401).json({ success: false, message: 'Não autenticado' });
            }
            const stats = await team_service_1.teamService.getTeamStats(leaderId);
            return res.json({ success: true, data: stats });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.teamController = new TeamController();
