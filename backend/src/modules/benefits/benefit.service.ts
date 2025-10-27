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
      `SELECT b.*, l.name as level_name, l.phase_number
       FROM benefits b
       INNER JOIN levels l ON l.id = b.level_id
       WHERE b.is_active = true
       AND l.points_required <= (
         SELECT COALESCE(MAX(accumulated_points), 0) 
         FROM points WHERE user_id = $1
       )
       ORDER BY l.phase_number ASC`,
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
