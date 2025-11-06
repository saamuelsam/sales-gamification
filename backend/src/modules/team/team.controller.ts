// backend/src/modules/team/team.controller.ts
import { Request, Response } from 'express';
import { teamService } from './team.service';

class TeamController {
  async getTeamMembers(req: Request, res: Response) {
    try {
      const leaderId = req.user?.userId;
      
      if (!leaderId) {
        return res.status(401).json({ success: false, message: 'Não autenticado' });
      }

      const members = await teamService.getTeamMembers(leaderId);
      return res.json({ success: true, data: members });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async addTeamMember(req: Request, res: Response) {
    try {
      const leaderId = req.user?.userId;
      const { email, name } = req.body;

      if (!leaderId) {
        return res.status(401).json({ success: false, message: 'Não autenticado' });
      }

      if (!email || !name) {
        return res.status(400).json({ success: false, message: 'Email e nome são obrigatórios' });
      }

      const member = await teamService.addTeamMember(leaderId, { email, name });
      return res.json({ success: true, data: member, message: 'Membro adicionado com sucesso' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async removeTeamMember(req: Request, res: Response) {
    try {
      const leaderId = req.user?.userId;
      const { memberId } = req.params;

      if (!leaderId) {
        return res.status(401).json({ success: false, message: 'Não autenticado' });
      }

      await teamService.removeTeamMember(leaderId, memberId);
      return res.json({ success: true, message: 'Membro removido com sucesso' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTeamStats(req: Request, res: Response) {
    try {
      const leaderId = req.user?.userId;

      if (!leaderId) {
        return res.status(401).json({ success: false, message: 'Não autenticado' });
      }

      const stats = await teamService.getTeamStats(leaderId);
      return res.json({ success: true, data: stats });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const teamController = new TeamController();
