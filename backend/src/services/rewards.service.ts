// Service para gerenciar bônus de avanço e premiações especiais
import { pool } from '@config/database';
import { getLevelConfig, SPECIAL_REWARDS } from '@config/levels';
import { emailService } from './email.service';

export class RewardsService {
  /**
   * Registra bônus de avanço de nível
   */
  async registerAdvancementBonus(
    userId: string,
    fromLevel: string,
    toLevel: string
  ) {
    const levelConfig = getLevelConfig(toLevel);
    
    if (!levelConfig || !levelConfig.advancementBonus) {
      console.log(`Sem bônus de avanço para ${toLevel}`);
      return null;
    }

    const query = `
      INSERT INTO advancement_bonuses (
        user_id,
        from_level,
        to_level,
        bonus_amount,
        bonus_description
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      fromLevel,
      toLevel,
      levelConfig.advancementBonus,
      levelConfig.advancementReward,
    ]);

    const bonus = result.rows[0];

    // Enviar notificação por email (fire-and-forget - não aguardar nem travar)
    pool.query('SELECT name, email FROM users WHERE id = $1', [userId])
      .then(userQuery => {
        const user = userQuery.rows[0];
        if (user && user.email && user.name) {
          emailService.sendLevelUpNotification(
            user.email,
            user.name,
            toLevel,
            levelConfig.advancementBonus,
            levelConfig.advancementReward || 'Bônus de avanço de nível'
          ).catch(err => console.error('Erro ao enviar email de nível:', err));
        }
      })
      .catch(err => console.error('Erro ao buscar usuário para email:', err));

    return bonus;
  }

  /**
   * Registra cesta básica (Elite com 400kW)
   */
  async registerBasicBasket(userId: string, kilowattsAchieved: number) {
    const query = `
      INSERT INTO special_rewards (
        user_id,
        reward_type,
        reward_description,
        kilowatts_achieved,
        period_start,
        period_end
      )
      VALUES ($1, $2, $3, $4, DATE_TRUNC('month', CURRENT_DATE), CURRENT_DATE)
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      'cesta_basica',
      'Cesta Básica por atingir 400kW',
      kilowattsAchieved,
    ]);

    return result.rows[0];
  }

  /**
   * Registra troféu trimestral
   */
  async registerQuarterlyTrophy(userId: string, description: string) {
    const query = `
      INSERT INTO special_rewards (
        user_id,
        reward_type,
        reward_description,
        period_start,
        period_end
      )
      VALUES (
        $1, 
        'trofeu', 
        $2,
        DATE_TRUNC('quarter', CURRENT_DATE),
        CURRENT_DATE
      )
      RETURNING *
    `;

    const result = await pool.query(query, [userId, description]);
    return result.rows[0];
  }

  /**
   * Registra cruzeiro para Top 10 do ano
   */
  async registerAnnualCruise() {
    // Buscar Top 10 vendedores do ano
    const topSellersQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        SUM(s.value) as total_sales,
        COUNT(s.id) as sales_count
      FROM users u
      INNER JOIN sales s ON s.user_id = u.id
      WHERE s.created_at >= DATE_TRUNC('year', CURRENT_DATE)
        AND s.status = 'approved'
      GROUP BY u.id, u.name, u.email
      ORDER BY total_sales DESC
      LIMIT 10
    `;

    const topSellers = await pool.query(topSellersQuery);

    const rewards = [];

    for (let i = 0; i < topSellers.rows.length; i++) {
      const seller = topSellers.rows[i];
      const position = i + 1;

      const query = `
        INSERT INTO special_rewards (
          user_id,
          reward_type,
          reward_description,
          ranking_position,
          period_start,
          period_end
        )
        VALUES (
          $1,
          'cruzeiro',
          $2,
          $3,
          DATE_TRUNC('year', CURRENT_DATE),
          CURRENT_DATE
        )
        RETURNING *
      `;

      const result = await pool.query(query, [
        seller.id,
        `Cruzeiro Top ${position} do Ano - ${seller.total_sales.toFixed(2)} em vendas`,
        position,
      ]);

      rewards.push(result.rows[0]);

      // Enviar email de congratulações (fire-and-forget)
      emailService.sendEmail({
        to: seller.email,
        subject: `🏆 Parabéns! Você está no Top ${position} e ganhou o Cruzeiro!`,
        html: `
          <h2>Parabéns, ${seller.name}!</h2>
          <p>Você está em <strong>${position}º lugar</strong> no ranking anual com <strong>R$ ${seller.total_sales.toFixed(2)}</strong> em vendas!</p>
          <p>Como prêmio, você ganhou o <strong>Cruzeiro de Fim de Ano</strong>!</p>
          <p>Em breve entraremos em contato com mais detalhes.</p>
          <br>
          <p>Continue assim!</p>
          <p>Equipe Fortal</p>
        `,
      }).catch(err => console.error('Erro ao enviar email de cruzeiro:', err));
    }

    return rewards;
  }

  /**
   * Lista prêmios pendentes de entrega
   */
  async listPendingRewards(userId?: string) {
    let query = `
      SELECT 
        sr.*,
        u.name as user_name,
        u.email as user_email
      FROM special_rewards sr
      INNER JOIN users u ON u.id = sr.user_id
      WHERE sr.delivered = false
    `;

    const params: any[] = [];

    if (userId) {
      query += ' AND sr.user_id = $1';
      params.push(userId);
    }

    query += ' ORDER BY sr.awarded_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Marca prêmio como entregue
   */
  async markRewardAsDelivered(rewardId: number) {
    const query = `
      UPDATE special_rewards
      SET 
        delivered = true,
        delivered_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [rewardId]);
    return result.rows[0];
  }

  /**
   * Lista todos os bônus de avanço pendentes de pagamento
   */
  async listPendingBonuses(userId?: string) {
    let query = `
      SELECT 
        ab.*,
        u.name as user_name,
        u.email as user_email
      FROM advancement_bonuses ab
      INNER JOIN users u ON u.id = ab.user_id
      WHERE ab.paid = false
    `;

    const params: any[] = [];

    if (userId) {
      query += ' AND ab.user_id = $1';
      params.push(userId);
    }

    query += ' ORDER BY ab.awarded_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Marca bônus como pago
   */
  async markBonusAsPaid(bonusId: number) {
    const query = `
      UPDATE advancement_bonuses
      SET 
        paid = true,
        paid_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [bonusId]);
    return result.rows[0];
  }

  /**
   * Atualiza ajuda de custo do executivo
   */
  async updateExecutiveAllowance(userId: string, salesCount: number) {
    const userQuery = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userQuery.rows[0];
    
    if (user?.role !== 'executive') {
      return null;
    }

    // Se fez 10 ou mais vendas, ajuda de custo sobe para R$ 5.000
    const allowance = salesCount >= 10 ? 5000 : 1518;

    const query = `
      UPDATE users
      SET fixed_allowance = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [allowance, userId]);
    return result.rows[0];
  }

  /**
   * Verifica e atribui cesta básica automaticamente
   */
  async checkAndAwardBasicBasket(userId: string) {
    const userQuery = await pool.query(
      `SELECT role, monthly_kilowatts FROM users WHERE id = $1`,
      [userId]
    );

    const user = userQuery.rows[0];

    if (user?.role === 'consultant' && user.monthly_kilowatts >= 400) {
      // Verificar se já não ganhou este mês
      const existingReward = await pool.query(
        `SELECT id FROM special_rewards
         WHERE user_id = $1
           AND reward_type = 'cesta_basica'
           AND period_start >= DATE_TRUNC('month', CURRENT_DATE)`,
        [userId]
      );

      if (existingReward.rows.length === 0) {
        return await this.registerBasicBasket(userId, user.monthly_kilowatts);
      }
    }

    return null;
  }
}

export const rewardsService = new RewardsService();
