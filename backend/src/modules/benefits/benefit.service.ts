// backend/src/modules/benefits/benefit.service.ts

import { pool } from '@config/database';

export class BenefitService {
  // Listar todos os benefícios
  async getAllBenefits() {
    const result = await pool.query(
      `SELECT b.*, l.name as level_name, l.phase_number
       FROM benefits b
       INNER JOIN levels l ON l.id = b.level_id
       WHERE b.is_active = true
       ORDER BY l.phase_number ASC, b.category ASC`
    );
    return result.rows;
  }

  // Benefícios por nível
  async getBenefitsByLevel(levelId: string) {
    const result = await pool.query(
      `SELECT * FROM benefits WHERE level_id = $1 AND is_active = true`,
      [levelId]
    );
    return result.rows;
  }

  // Benefícios desbloqueados pelo usuário
  async getUserUnlockedBenefits(userId: string) {
    const result = await pool.query(
      `SELECT 
        b.*,
        l.name as level_name,
        l.phase_number,
        l.role as level_role,
        l.points_required as level_points_required,
        u.role as user_role,
        COALESCE(u.points, 0) as user_points,
        COALESCE(
          (SELECT COUNT(*) 
           FROM sales s 
           WHERE s.user_id = $1 
           AND s.status IN ('negotiation', 'approved', 'completed')
           AND DATE_TRUNC('month', s.created_at) = DATE_TRUNC('month', CURRENT_DATE)),
          0
        ) as monthly_sales,
        COALESCE(
          (SELECT SUM(s.kilowatts) 
           FROM sales s 
           WHERE s.user_id = $1 
           AND s.status IN ('negotiation', 'approved', 'completed')
           AND DATE_TRUNC('month', s.created_at) = DATE_TRUNC('month', CURRENT_DATE)),
          0
        ) as monthly_kilowatts,
        -- Verifica se o benefício está desbloqueado
        CASE
          -- Cesta básica: precisa de 400 kW no mês (considera vendas em negociação, aprovadas e completas)
          WHEN b.title LIKE '%Cesta Basica%' THEN
            (SELECT SUM(s.kilowatts) >= 400
             FROM sales s 
             WHERE s.user_id = $1 
             AND s.status IN ('negotiation', 'approved', 'completed')
             AND DATE_TRUNC('month', s.created_at) = DATE_TRUNC('month', CURRENT_DATE))
          
          -- Benefícios mensais: precisa ter o nível E manter meta mensal
          WHEN b.period = 'monthly' THEN
            (l.phase_number <= 
             (SELECT phase_number FROM levels WHERE role = u.role LIMIT 1))
          
          -- Benefícios de avanço: só desbloqueia quando ATINGE o nível
          WHEN b.period = 'advancement' THEN
            (l.phase_number = 
             (SELECT phase_number FROM levels WHERE role = u.role LIMIT 1))
          
          ELSE FALSE
        END as is_unlocked
       FROM benefits b
       INNER JOIN levels l ON l.id = b.level_id
       CROSS JOIN users u
       WHERE b.is_active = true
       AND u.id = $1
       ORDER BY l.phase_number ASC, b.category ASC`,
      [userId]
    );
    return result.rows;
  }

  // Criar benefício (admin)
  async createBenefit(data: any) {
    const { level_id, title, description, category, period, image_url, terms } = data;

    const result = await pool.query(
      `INSERT INTO benefits (level_id, title, description, category, period, image_url, terms)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [level_id, title, description, category, period, image_url, terms]
    );

    return result.rows[0];
  }

  // Atualizar benefício (admin)
  async updateBenefit(id: string, data: any) {
    const fields = Object.keys(data)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    const values = [...Object.values(data), id];

    const result = await pool.query(
      `UPDATE benefits SET ${fields} WHERE id = $${values.length} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Deletar benefício (admin)
  async deleteBenefit(id: string) {
    await pool.query('UPDATE benefits SET is_active = false WHERE id = $1', [id]);
    return { message: 'Benefício removido com sucesso' };
  }
}
