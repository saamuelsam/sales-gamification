// backend/src/modules/points/points.service.ts

import { pool } from '@config/database';

export class PointsService {
  // Buscar histórico de pontos do usuário
  async getUserPointsHistory(userId: string) {
    const result = await pool.query(
      `SELECT p.*, s.client_name, s.value, s.kilowatts
       FROM points p
       LEFT JOIN sales s ON s.id = p.sale_id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // Buscar pontos totais acumulados
  async getUserTotalPoints(userId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COALESCE(MAX(accumulated_points), 0) as total_points
       FROM points
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0]?.total_points || 0;
  }

  // Ranking de usuários por pontos
  async getPointsRanking(limit: number = 10) {
    const result = await pool.query(
      `SELECT 
         u.id,
         u.name,
         u.email,
         COALESCE(MAX(p.accumulated_points), 0) as total_points,
         COUNT(DISTINCT s.id) as total_sales,
         l.name as current_level,
         l.phase_number
       FROM users u
       LEFT JOIN points p ON p.user_id = u.id
       LEFT JOIN sales s ON s.user_id = u.id AND s.status = 'closed'
       LEFT JOIN levels l ON COALESCE(MAX(p.accumulated_points), 0) >= l.points_required
       WHERE u.is_active = true
       GROUP BY u.id, u.name, u.email, l.name, l.phase_number
       ORDER BY total_points DESC, l.phase_number DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // Progresso do usuário até próximo nível
  async getUserProgress(userId: string) {
    const totalPoints = await this.getUserTotalPoints(userId);

    const levelResult = await pool.query(
      `SELECT 
         current_level.name as current_level_name,
         current_level.points_required as current_level_points,
         current_level.phase_number as current_phase,
         next_level.name as next_level_name,
         next_level.points_required as next_level_points,
         next_level.phase_number as next_phase
       FROM levels current_level
       LEFT JOIN levels next_level ON next_level.phase_number = current_level.phase_number + 1
       WHERE $1 >= current_level.points_required
       ORDER BY current_level.points_required DESC
       LIMIT 1`,
      [totalPoints]
    );

    if (levelResult.rows.length === 0) {
      // Usuário ainda não tem pontos
      const firstLevel = await pool.query(
        'SELECT * FROM levels ORDER BY phase_number ASC LIMIT 1'
      );
      return {
        current_level: null,
        next_level: firstLevel.rows[0]?.name,
        current_points: totalPoints,
        points_to_next_level: firstLevel.rows[0]?.points_required || 0,
        progress_percentage: 0,
      };
    }

    const level = levelResult.rows[0];
    const pointsToNext = level.next_level_points
      ? level.next_level_points - totalPoints
      : 0;

    const progressPercentage = level.next_level_points
      ? ((totalPoints - level.current_level_points) /
          (level.next_level_points - level.current_level_points)) *
        100
      : 100;

    return {
      current_level: level.current_level_name,
      next_level: level.next_level_name || 'Nível Máximo',
      current_points: totalPoints,
      points_to_next_level: Math.max(0, pointsToNext),
      progress_percentage: Math.min(100, Math.round(progressPercentage)),
    };
  }
}
