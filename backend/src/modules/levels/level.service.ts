import { pool } from '@config/database';
import { notificationsService } from '../notifications/notifications.service';
import { logActivity } from '../../utils/activityLogger';
import { rewardsService as advancementRewardsService } from '../../services/rewards.service';

export class LevelService {
  // 🔹 Listar todos os níveis
  async getAllLevels() {
    const result = await pool.query(
      'SELECT * FROM levels ORDER BY phase_number ASC'
    );
    return result.rows;
  }

  // 🔹 Buscar nível por pontos
  async getLevelByPoints(points: number) {
    const result = await pool.query(
      `SELECT * FROM levels 
       WHERE points_required <= $1 
       ORDER BY points_required DESC 
       LIMIT 1`,
      [points]
    );
    return result.rows[0];
  }

  /**
   * 🆙 Verificar e aplicar promoção automática
   */
  async checkLevelUp(userId: string, currentPoints: number, client: any) {
    try {
      // Buscar dados do usuário
      const userResult = await client.query(
        `SELECT id, name, role, points FROM users WHERE id = $1`,
        [userId]
      );
      if (userResult.rowCount === 0) return { leveledUp: false };

      const user = userResult.rows[0];
      const currentRole = user.role || 'consultant';

      // 🔒 PROTEÇÃO: Não alterar roles administrativos (CEO, Admin, Financeiro, Diretor Comercial)
      const protectedRoles = ['ceo', 'admin', 'financeiro', 'diretor_comercial'];
      if (protectedRoles.includes(currentRole.toLowerCase())) {
        console.log(`🔒 Role protegido: ${user.name} é ${currentRole} - sem auto-promoção`);
        return { leveledUp: false, reason: 'protected_role' };
      }

      // ✅ Para Sênior+, calcular pontos totais (pessoal + equipe)
      let totalPoints = Math.max(currentPoints, parseFloat(user.points || 0));
      
      // Se for Sênior, Prime ou Executivo, incluir pontos da equipe
      const rolePhaseMap: Record<string, number> = {
        'consultant': 1,
        'master_consultant': 2,
        'senior_consultant': 3,
        'prime_consultant': 4,
        'executive': 5
      };
      
      const currentPhase = rolePhaseMap[currentRole] || 1;
      
      // Fases 3+ (Sênior+) exigem pontos da equipe
      if (currentPhase >= 3) {
        // 🔥 CORREÇÃO: Usar team_points diretamente da coluna do usuário
        const userPointsResult = await client.query(
          `SELECT 
            COALESCE(personal_points, 0)::NUMERIC AS personal_points,
            COALESCE(team_points, 0)::NUMERIC AS team_points
           FROM users
           WHERE id = $1`,
          [userId]
        );
        
        const personalPoints = parseFloat(userPointsResult.rows[0]?.personal_points || 0);
        const teamPoints = parseFloat(userPointsResult.rows[0]?.team_points || 0);
        totalPoints = personalPoints + teamPoints;
        
        console.log(`📊 ${user.name}: Pontos pessoais ${personalPoints} + Equipe ${teamPoints} = Total ${totalPoints}`);
      }

      // Buscar o nível mais alto atingido baseado em pontos
      const newLevelResult = await client.query(
        `SELECT * FROM levels
         WHERE points_required <= $1
         ORDER BY points_required DESC
         LIMIT 1`,
        [totalPoints]
      );
      const newLevel = newLevelResult.rows[0];

      if (!newLevel) {
        console.log(`⚠️ Nenhum nível disponível para ${totalPoints} pontos`);
        return { leveledUp: false };
      }

      const newRole = newLevel.role;

      // Evita atualização redundante
      if (newRole === currentRole) {
        console.log(`✅ ${user.name} já está no nível ${newLevel.name}`);
        return { leveledUp: false };
      }

      // ✅ VALIDAÇÃO DE CONTRATOS MÍNIMOS MENSAIS (Master+)
      // 🔥 Verificar se a funcionalidade está ativada
      const settingsService = require('../settings/settings.service').default;
      const contractsEnabled = await settingsService.isContractsPerMonthEnabled();
      
      const minContractsMap: Record<string, number> = {
        'master_consultant': 2,
        'senior_consultant': 4,
        'prime_consultant': 5,
        'executive': 10
      };
      
      const minContractsRequired = minContractsMap[newRole];
      
      if (contractsEnabled && minContractsRequired) {
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);
        
        const contractsResult = await client.query(
          `SELECT COUNT(*)::int as total_contracts
           FROM sales
           WHERE user_id = $1
             AND created_at >= $2
             AND status IN ('approved', 'delivered')`,
          [userId, firstDayOfMonth]
        );
        
        const monthlyContracts = contractsResult.rows[0]?.total_contracts || 0;
        
        if (monthlyContracts < minContractsRequired) {
          console.log(
            `⚠️ ${user.name} não atingiu contratos mínimos para ${newLevel.name}: ${monthlyContracts}/${minContractsRequired} este mês`
          );
          return {
            leveledUp: false,
            reason: 'min_contracts_not_met',
            requiredContracts: minContractsRequired,
            currentContracts: monthlyContracts
          };
        }
        
        console.log(`✅ Contratos OK: ${monthlyContracts}/${minContractsRequired}`);
      }

      // Atualiza o cargo do usuário
      await client.query(
        `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2`,
        [newRole, userId]
      );

      console.log(
        `🎉 ${user.name} subiu de nível: ${currentRole} → ${newRole} (${newLevel.name})`
      );

      // ✅ REGISTRAR BÔNUS DE AVANÇO DE NÍVEL (fire-and-forget)
      advancementRewardsService.registerAdvancementBonus(userId, currentRole, newRole)
        .then(() => console.log(`💰 Bônus de avanço registrado para ${user.name}`))
        .catch(bonusError => console.error('Erro ao registrar bônus de avanço:', bonusError));

      // 📝 LOG: Promoção de nível
      await logActivity(userId, 'Subiu de nível', {
        from_level: currentRole,
        to_level: newRole,
        level_name: newLevel.name,
        total_points: totalPoints,
        phase: newLevel.phase_number
      });

      // Criar registro de recompensa (subida de nível)
      await client.query(
        `INSERT INTO rewards (user_id, reward_type, description, points_earned, threshold_reached, status)
         VALUES ($1, 'level_up', $2, $3, $4, 'pending')`,
        [
          userId,
          `Parabéns! Você alcançou o nível ${newLevel.name}!`,
          totalPoints,
          newLevel.points_required,
        ]
      );

      // Criar notificação
      const bonusText = newLevel.advancement_bonus
        ? `💰 Bônus: R$ ${newLevel.advancement_bonus.toLocaleString('pt-BR')}\n`
        : '';
      const helpText = newLevel.fixed_allowance
        ? `🎁 Ajuda de custo: R$ ${newLevel.fixed_allowance.toLocaleString('pt-BR')}/mês\n`
        : '';
      const rewardText = newLevel.advancement_reward
        ? `🏆 ${newLevel.advancement_reward}`
        : '';

      const message = `🆙 Você atingiu o nível **${newLevel.name}**!\n\n${bonusText}${helpText}${rewardText}\n\n💼 Comissão Pessoal: ${newLevel.personal_commission}%`;

      await notificationsService.create(userId, {
        type: 'level_up',
        title: `🏆 Promoção: ${newLevel.name}`,
        message,
        metadata: {
          previousRole: currentRole,
          newRole,
          levelName: newLevel.name,
          bonus: newLevel.advancement_bonus,
          helpValue: newLevel.fixed_allowance,
          reward: newLevel.advancement_reward,
          commission: newLevel.personal_commission,
        },
      });

      return {
        leveledUp: true,
        previousRole: currentRole,
        newRole,
        newLevel: newLevel.name,
        bonus: newLevel.advancement_bonus,
        helpValue: newLevel.fixed_allowance,
        reward: newLevel.advancement_reward,
      };
    } catch (error) {
      console.error('❌ Erro ao verificar promoção:', error);
      return { leveledUp: false };
    }
  }

  /**
   * 📊 Retorna o progresso do usuário em relação ao próximo nível
   * ✅ ATUALIZADO: Sincroniza com níveis reais do banco de dados
   */
  async getUserGoals(userId: string) {
    const userResult = await pool.query(
      `SELECT id, role, points FROM users WHERE id = $1`,
      [userId]
    );
    const user = userResult.rows[0];
    if (!user) throw new Error('Usuário não encontrado');

    // ✅ Buscar nível atual direto do banco (fonte única de verdade)
    const currentLevelResult = await pool.query(
      `SELECT * FROM levels WHERE role = $1`,
      [user.role]
    );
    const currentLevel = currentLevelResult.rows[0];
    if (!currentLevel) {
      throw new Error(`Nível atual não encontrado para role: ${user.role}`);
    }

    // ✅ Buscar próximo nível baseado em phase_number (mais confiável que points_required)
    const currentPhase = parseInt(currentLevel.phase_number);
    const nextLevelResult = await pool.query(
      `SELECT * FROM levels
       WHERE phase_number > $1
       AND role NOT IN ('ceo', 'admin', 'financeiro', 'diretor_comercial')
       ORDER BY phase_number ASC
       LIMIT 1`,
      [currentPhase]
    );

    const nextLevel = nextLevelResult.rows[0] || null;
    const currentPoints = parseFloat(user.points || 0);

    let progressPercentage = 0;
    let pointsToNextLevel = 0;

    if (nextLevel) {
      const currentRequired = parseFloat(currentLevel.points_required || 0);
      const nextRequired = parseFloat(nextLevel.points_required || 0);
      const delta = nextRequired - currentRequired;
      const gained = currentPoints - currentRequired;
      
      if (delta > 0) {
        progressPercentage = Math.min(100, Math.max(0, (gained / delta) * 100));
      }
      pointsToNextLevel = Math.max(0, nextRequired - currentPoints);
    }

    // ✅ Requisitos dinâmicos baseados no role atual
    const requirements = {
      minContracts: this.getMinContracts(user.role),
      minSalesValue: parseFloat(currentLevel.monthly_sales_goal || 0),
      bonusGoal: parseFloat(currentLevel.bonus_goal || 0),
    };

    return {
      currentLevel,
      nextLevel,
      currentPoints,
      progressPercentage: Math.round(progressPercentage),
      pointsToNextLevel,
      requirements,
    };
  }

  /**
   * 🎯 Retorna requisitos mínimos de contratos por role
   */
  private getMinContracts(role: string): number {
    const contractsMap: Record<string, number> = {
      'consultant': 1,
      'master_consultant': 2,
      'senior_consultant': 4,
      'prime_consultant': 5,
      'executive': 10,
      'ceo': 10,
      'diretor_comercial': 0,
      'admin': 0,
      'financeiro': 0,
    };
    return contractsMap[role] || 0;
  }

  // 🔹 Buscar nível por ID
  async getLevelById(id: string) {
    try {
      const result = await pool.query('SELECT * FROM levels WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao buscar nível por ID:', error);
      throw error;
    }
  }

  // 🔹 Criar novo nível (admin)
  async createLevel(data: any) {
    try {
      const {
        phase_number,
        name,
        subtitle,
        points_required,
        max_lines,
        personal_commission,
        insurance_commission,
        network_commission,
        fixed_allowance,
        monthly_sales_goal,
        bonus_goal,
        bonus_allowance,
        advancement_bonus,
        advancement_reward,
        role,
      } = data;

      const result = await pool.query(
        `INSERT INTO levels (
          phase_number, name, subtitle, points_required, max_lines,
          personal_commission, insurance_commission, network_commission,
          fixed_allowance, monthly_sales_goal, bonus_goal, bonus_allowance,
          advancement_bonus, advancement_reward, role
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
        ) RETURNING *`,
        [
          phase_number,
          name,
          subtitle,
          points_required,
          max_lines,
          personal_commission,
          insurance_commission,
          network_commission,
          fixed_allowance,
          monthly_sales_goal,
          bonus_goal,
          bonus_allowance,
          advancement_bonus,
          advancement_reward,
          role,
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar nível:', error);
      throw error;
    }
  }

  // 🔹 Atualizar nível (admin)
  async updateLevel(id: string, data: any) {
    try {
      const entries = Object.entries(data);
      const fields = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
      const values = [...entries.map(([, v]) => v), id];

      const result = await pool.query(
        `UPDATE levels SET ${fields} WHERE id = $${values.length} RETURNING *`,
        values
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar nível:', error);
      throw error;
    }
  }

  // 🔹 Deletar nível (admin)
  async deleteLevel(id: string) {
    try {
      await pool.query('DELETE FROM levels WHERE id = $1', [id]);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar nível:', error);
      throw error;
    }
  }

  // 🔹 Listar níveis com progresso (para dashboard)
  async getLevelPathway(userId: string) {
    try {
      const userResult = await pool.query(
        `SELECT role, points FROM users WHERE id = $1`,
        [userId]
      );
      const user = userResult.rows[0];
      if (!user) throw new Error('Usuário não encontrado.');

      const levelsResult = await pool.query(
        'SELECT * FROM levels ORDER BY phase_number ASC'
      );

      const levels = levelsResult.rows.map((level: any) => ({
        ...level,
        achieved: user.points >= level.points_required,
        isCurrent: user.role === level.role,
      }));

      return levels;
    } catch (error) {
      console.error('Erro ao buscar níveis do usuário:', error);
      throw error;
    }
  }
}

export const levelService = new LevelService();
