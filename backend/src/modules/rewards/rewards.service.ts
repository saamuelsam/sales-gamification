import { pool } from '../../config/database';

export class RewardsService {
  async checkMonthlyReward(userId: string, client: any) {
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    // Buscar total de kW e vendas do mês
    const monthlyKwResult = await client.query(
      `SELECT 
         COALESCE(SUM(kilowatts), 0) as total_kw,
         COUNT(*)::int as total_sales
       FROM sales 
       WHERE user_id = $1 
         AND created_at >= $2
         AND status NOT IN ('cancelled', 'financing_denied')`,
      [userId, firstDayOfMonth]
    );

    const totalKw = parseFloat(monthlyKwResult.rows[0].total_kw);
    const totalSales = parseInt(monthlyKwResult.rows[0].total_sales);

    // Verificar se já ganhou prêmio este mês
    const existingRewardResult = await client.query(
      `SELECT id FROM rewards 
       WHERE user_id = $1 
         AND reward_type = 'cesta_basica'
         AND created_at >= $2`,
      [userId, firstDayOfMonth]
    );

    const hasRewardThisMonth = existingRewardResult.rows.length > 0;

    // REGRA: 400 kW + pelo menos 1 venda = Cesta Básica
    if (totalKw >= 400 && totalSales >= 1 && !hasRewardThisMonth) {
      // Registrar prêmio
      await client.query(
        `INSERT INTO rewards (user_id, reward_type, description, points_earned, threshold_reached, status)
         VALUES ($1, 'cesta_basica', 'Cesta Básica - 400 kW atingidos no mês', $2, 400, 'pending')`,
        [userId, totalKw]
      );

      // Criar notificação
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, metadata)
         VALUES ($1, 'reward', '🎁 Parabéns! Você ganhou uma Cesta Básica!', 
                 'Você atingiu 400 kW este mês e conquistou uma Cesta Básica! Entre em contato com a administração para retirar seu prêmio.', 
                 $2)`,
        [userId, JSON.stringify({ reward_type: 'cesta_basica', kw_total: totalKw, threshold: 400 })]
      );

      return true;
    }

    return false;
  }

  async list(userId: string) {
    const result = await pool.query(
      `SELECT * FROM rewards 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }
}

export const rewardsService = new RewardsService();
