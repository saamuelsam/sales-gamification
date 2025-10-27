// backend/src/modules/levels/level.service.ts

import { pool } from '@config/database';

export class LevelService {
  // Listar todos os níveis
  async getAllLevels() {
    const result = await pool.query(
      'SELECT * FROM levels ORDER BY phase_number ASC'
    );
    return result.rows;
  }

  // Buscar nível específico
  async getLevelById(id: string) {
    const result = await pool.query('SELECT * FROM levels WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Buscar nível por pontos
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

  // Criar novo nível (admin)
  async createLevel(data: any) {
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
      advancement_bonus,
      advancement_reward,
    } = data;

    const result = await pool.query(
      `INSERT INTO levels (
        phase_number, name, subtitle, points_required, max_lines,
        personal_commission, insurance_commission, network_commission,
        fixed_allowance, monthly_sales_goal, advancement_bonus, advancement_reward
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
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
        advancement_bonus,
        advancement_reward,
      ]
    );

    return result.rows[0];
  }

  // Atualizar nível (admin)
  async updateLevel(id: string, data: any) {
    const fields = Object.keys(data)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    const values = [...Object.values(data), id];

    const result = await pool.query(
      `UPDATE levels SET ${fields} WHERE id = $${values.length} RETURNING *`,
      values
    );

    return result.rows[0];
  }
}
