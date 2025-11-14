import { Request, Response } from 'express';
import { UserService } from './user.service';
import { ApiResponse } from '../../utils/responses';

const userService = new UserService();

export class UserController {
  // ========== DASHBOARD ==========
  async getDashboard(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const dashboard = await userService.getDashboard(String(userId));
      return ApiResponse.success(res, dashboard, 'Dashboard carregado com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar dashboard', 500);
    }
  }

  // ========== PERFIL ==========
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const profile = await userService.getProfile(String(userId));
      return ApiResponse.success(res, profile, 'Perfil carregado com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar perfil', 500);
    }
  }

  async getUserLevel(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const levelProgress = await userService.getUserLevelProgress(String(userId));
      return ApiResponse.success(res, levelProgress, 'Progresso de nível carregado');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar progresso', 500);
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const profile = await userService.updateProfile(String(userId), req.body);
      return ApiResponse.success(res, profile, 'Perfil atualizado com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao atualizar perfil', 500);
    }
  }

  // ========== EQUIPE ==========

  /**
   * 🔥 Adiciona um membro existente à equipe
   * - Verifica se o usuário existe
   * - Impede duplicações
   * - Atualiza o parent_id ou a hierarquia
   */
  async addMember(req: Request, res: Response) {
    try {
      const parentId = req.user?.userId;
      const { email, name } = req.body;

      // 🔒 Verificações básicas
      if (!parentId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      if (!email || !email.trim()) {
        return ApiResponse.error(res, 'Email é obrigatório', 400);
      }

      // 🔹 Monta os dados de entrada
      const memberData = {
        email: email.trim(),
        name: name?.trim() || undefined, // opcional
      };

      // 🔹 Chama o service responsável pela lógica
      const result = await userService.addTeamMember(String(parentId), memberData);

      // 🔹 Trata respostas do service
      if (!result.success) {
        return ApiResponse.error(res, result.message, result.statusCode || 400);
      }

      return ApiResponse.success(
        res,
        result.data || null,
        result.message || `${memberData.name || 'Membro'} adicionado à equipe com sucesso`
      );
    } catch (error: any) {
      console.error('❌ Erro em addMember:', error);
      const message = error instanceof Error ? error.message : 'Erro ao adicionar membro';
      return ApiResponse.error(res, message, 500);
    }
  }

  async getMyTeam(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const team = await userService.getDirectTeamMembers(String(userId));
      return ApiResponse.success(res, team, 'Membros da equipe carregados com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar equipe', 500);
    }
  }

  async getFullNetwork(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const network = await userService.getFullNetwork(String(userId));
      return ApiResponse.success(res, network, 'Rede completa carregada com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar rede completa', 500);
    }
  }

  async getTeamStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const stats = await userService.getTeamStats(String(userId));
      return ApiResponse.success(res, stats, 'Estatísticas da equipe carregadas');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar estatísticas', 500);
    }
  }

  async checkHasTeam(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const hasTeam = await userService.hasTeam(String(userId));
      return ApiResponse.success(res, { has_team: hasTeam });
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao verificar equipe', 500);
    }
  }

  /**
   * 🔥 Remove um membro da equipe
   */
  async removeTeamMember(req: Request, res: Response) {
    try {
      const leaderId = req.user?.userId;
      const { id: memberId } = req.params;

      if (!leaderId) return ApiResponse.error(res, 'Usuário não autenticado', 401);
      if (!memberId) return ApiResponse.error(res, 'ID do membro é obrigatório', 400);

      const result = await userService.removeTeamMember(String(leaderId), String(memberId));

      if (!result.success) {
        return ApiResponse.error(res, result.message, result.statusCode || 400);
      }

      return ApiResponse.success(res, null, result.message);
    } catch (error: any) {
      console.error('❌ Erro em removeTeamMember:', error);
      return ApiResponse.error(res, error.message || 'Erro ao remover membro', 500);
    }
  }

  // ========== CRUD GERAL ==========
  async list(req: Request, res: Response) {
    try {
      const users = await userService.list();
      return ApiResponse.success(res, users, 'Usuários listados com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao listar usuários', 500);
    }
  }

  async find(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return ApiResponse.error(res, 'ID é obrigatório', 400);

      const user = await userService.findById(id);
      return ApiResponse.success(res, user, 'Usuário encontrado');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar usuário', 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return ApiResponse.error(res, 'ID é obrigatório', 400);

      const user = await userService.update(id, req.body);
      return ApiResponse.success(res, user, 'Usuário atualizado');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao atualizar usuário', 500);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return ApiResponse.error(res, 'ID é obrigatório', 400);

      await userService.remove(id);
      return ApiResponse.success(res, null, 'Usuário removido com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao remover usuário', 500);
    }
  }
}

export const userController = new UserController();
