// Service para gerenciar metas mensais e rebaixamento de usuários
import { pool } from '@config/database';
import { getLevelConfig } from '@config/levels';

export class MonthlyTargetService {
  /**
   * Atualiza contadores mensais do usuário após uma venda
   */
  async updateUserMonthlyStats(userId: string, kilowatts: number) {
    const query = `
      UPDATE users 
      SET 
        monthly_contracts = COALESCE(monthly_contracts, 0) + 1,
        monthly_kilowatts = COALESCE(monthly_kilowatts, 0) + $2
      WHERE id = $1
      RETURNING monthly_contracts, monthly_kilowatts
    `;
    
    const result = await pool.query(query, [userId, kilowatts]);
    return result.rows[0];
  }

  /**
   * Verifica se o usuário atingiu a meta mensal
   */
  async checkMonthlyTarget(userId: string): Promise<{
    achieved: boolean;
    contracts: number;
    kilowatts: number;
    targetContracts: number;
    targetKilowatts: number;
  }> {
    const userQuery = `
      SELECT id, role, monthly_contracts, monthly_kilowatts
      FROM users
      WHERE id = $1
    `;
    
    const userResult = await pool.query(userQuery, [userId]);
    const user = userResult.rows[0];
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const targetQuery = `
      SELECT min_contracts, min_kilowatts
      FROM monthly_targets
      WHERE level = $1
    `;
    
    const targetResult = await pool.query(targetQuery, [user.role]);
    const target = targetResult.rows[0];

    if (!target) {
      return {
        achieved: true,
        contracts: user.monthly_contracts || 0,
        kilowatts: user.monthly_kilowatts || 0,
        targetContracts: 0,
        targetKilowatts: 0,
      };
    }

    const achieved = 
      (user.monthly_contracts || 0) >= target.min_contracts &&
      (user.monthly_kilowatts || 0) >= target.min_kilowatts;

    return {
      achieved,
      contracts: user.monthly_contracts || 0,
      kilowatts: user.monthly_kilowatts || 0,
      targetContracts: target.min_contracts,
      targetKilowatts: target.min_kilowatts,
    };
  }

  /**
   * Verifica todos os usuários e incrementa contador de meses abaixo da meta
   */
  async checkAllUsersTargets() {
    const query = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.monthly_contracts,
        u.monthly_kilowatts,
        u.months_below_target,
        mt.min_contracts,
        mt.min_kilowatts
      FROM users u
      LEFT JOIN monthly_targets mt ON mt.level = u.role
      WHERE u.role IN ('master_consultant', 'senior_consultant', 'prime_consultant', 'executive')
        AND u.is_active = true
    `;

    const result = await pool.query(query);
    const usersToCheck = result.rows;

    const results = [];

    for (const user of usersToCheck) {
      const belowTarget = 
        (user.monthly_contracts || 0) < user.min_contracts ||
        (user.monthly_kilowatts || 0) < user.min_kilowatts;

      if (belowTarget) {
        const newCount = (user.months_below_target || 0) + 1;
        
        await pool.query(
          `UPDATE users 
           SET months_below_target = $1 
           WHERE id = $2`,
          [newCount, user.id]
        );

        results.push({
          userId: user.id,
          email: user.email,
          name: user.name,
          monthsBelowTarget: newCount,
          willLosePoints: newCount >= 3,
        });

        // Se passou 3 meses, ZERAR PONTOS (sem rebaixar nível)
        if (newCount >= 3) {
          await this.resetUserPoints(user.id);
        }
      } else {
        // Resetar contador se bateu meta
        await pool.query(
          `UPDATE users 
           SET months_below_target = 0 
           WHERE id = $1`,
          [user.id]
        );

        results.push({
          userId: user.id,
          email: user.email,
          name: user.name,
          monthsBelowTarget: 0,
          achievedTarget: true,
        });
      }
    }

    return results;
  }

  /**
   * ZERA TODOS OS PONTOS do usuário (penalidade por 3 meses sem meta)
   */
  async resetUserPoints(userId: string) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Buscar informações do usuário antes de zerar
      const userQuery = await client.query(
        'SELECT name, email, role, points FROM users WHERE id = $1',
        [userId]
      );
      const user = userQuery.rows[0];
      const pointsLost = user.points || 0;

      // ⚠️ ZERAR TODOS OS PONTOS (regra dos 3 meses consecutivos)
      await client.query(
        `UPDATE users 
         SET points = 0, months_below_target = 0 
         WHERE id = $1`,
        [userId]
      );

      // Registrar histórico da perda de pontos
      await client.query(
        `INSERT INTO user_level_history (user_id, previous_level, new_level, reason, changed_by)
         VALUES ($1, $2, $2, $3, $4)`,
        [userId, user.role, `PENALIDADE: Não bateu meta por 3 meses consecutivos - PERDEU ${pointsLost} PONTOS`, 'SYSTEM']
      );

      await client.query('COMMIT');

      console.log(`⚠️ PENALIDADE APLICADA: ${user.name} (${user.email})`);
      console.log(`   - Nível mantido: ${user.role}`);
      console.log(`   - Pontos perdidos: ${pointsLost}`);
      console.log(`   - Pontos atuais: 0`);
      console.log(`   - Contador resetado`);
      
      return {
        userId,
        userName: user.name,
        userEmail: user.email,
        currentLevel: user.role,
        pointsLost,
        reason: 'Não bateu meta por 3 meses consecutivos',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao zerar pontos do usuário:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Rebaixa usuário um nível e ZERA TODOS OS PONTOS
   * @deprecated Não usar mais - usar apenas resetUserPoints
   */
  async demoteUser(userId: string, currentRole: string) {
    const demotionMap: Record<string, string> = {
      executive: 'prime_consultant',
      prime_consultant: 'senior_consultant',
      senior_consultant: 'master_consultant',
      master_consultant: 'consultant',
    };

    const newRole = demotionMap[currentRole];
    
    if (!newRole) {
      console.log(`Usuário ${userId} já está no nível mínimo, não pode ser rebaixado`);
      return null;
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Buscar pontos atuais antes de zerar
      const userQuery = await client.query(
        'SELECT name, email, points FROM users WHERE id = $1',
        [userId]
      );
      const user = userQuery.rows[0];
      const pointsLost = user.points || 0;

      // ⚠️ ZERAR TODOS OS PONTOS (regra dos 3 meses consecutivos)
      await client.query(
        `UPDATE users 
         SET role = $1, months_below_target = 0, points = 0
         WHERE id = $2`,
        [newRole, userId]
      );

      // Registrar histórico com informação de perda de pontos
      await client.query(
        `INSERT INTO user_level_history (user_id, previous_level, new_level, reason, changed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, currentRole, newRole, `Não bateu meta por 3 meses consecutivos - PERDEU ${pointsLost} PONTOS`, 'SYSTEM']
      );

      await client.query('COMMIT');

      console.log(`⚠️ PENALIDADE: ${user.name} (${user.email})`);
      console.log(`   - Rebaixado: ${currentRole} → ${newRole}`);
      console.log(`   - Pontos perdidos: ${pointsLost}`);
      console.log(`   - Pontos atuais: 0`);
      
      return {
        userId,
        userName: user.name,
        userEmail: user.email,
        previousLevel: currentRole,
        newLevel: newRole,
        pointsLost,
        reason: 'Não bateu meta por 3 meses consecutivos',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao rebaixar usuário:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reset mensal dos contadores
   */
  async resetMonthlyCounters() {
    const query = `
      UPDATE users 
      SET 
        monthly_contracts = 0,
        monthly_kilowatts = 0,
        last_target_check = CURRENT_DATE
      WHERE last_target_check < DATE_TRUNC('month', CURRENT_DATE)
        OR last_target_check IS NULL
      RETURNING id, email, name
    `;

    const result = await pool.query(query);
    console.log(`Reset mensal: ${result.rowCount} usuários atualizados`);
    return result.rows;
  }

  /**
   * Verifica estrutura da equipe do usuário
   */
  async checkTeamStructure(userId: string) {
    const query = `
      WITH RECURSIVE team AS (
        SELECT id, parent_id, role, 1 as depth
        FROM user_hierarchy
        WHERE leader_id = $1
        
        UNION ALL
        
        SELECT uh.id, uh.parent_id, u.role, team.depth + 1
        FROM user_hierarchy uh
        INNER JOIN team ON team.id = uh.parent_id
        INNER JOIN users u ON u.id = uh.id
        WHERE team.depth < 10
      )
      SELECT 
        depth,
        COUNT(*) as members_count,
        array_agg(DISTINCT role) as roles_present
      FROM team
      GROUP BY depth
      ORDER BY depth
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Calcula pontos acumulados da equipe
   */
  async calculateTeamPoints(userId: string): Promise<number> {
    const query = `
      WITH RECURSIVE team AS (
        SELECT id, parent_id, 1 as depth
        FROM user_hierarchy
        WHERE leader_id = $1
        
        UNION ALL
        
        SELECT uh.id, uh.parent_id, team.depth + 1
        FROM user_hierarchy uh
        INNER JOIN team ON team.id = uh.parent_id
        WHERE team.depth < 10
      )
      SELECT COALESCE(SUM(u.points), 0) as total_team_points
      FROM team t
      INNER JOIN users u ON u.id = t.id
    `;

    const result = await pool.query(query, [userId]);
    return parseFloat(result.rows[0]?.total_team_points || '0');
  }
}

export const monthlyTargetService = new MonthlyTargetService();
