import { Request, Response } from 'express';
import { pool } from '@config/database';
import { ApiResponse } from '../../utils/responses';

export class UpdateClientController {
  /**
   * Atualiza os dados do cliente de uma venda
   * Apenas o consultor que criou a venda (ou superiores) pode editar
   */
  async updateSaleClient(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const { id: saleId } = req.params;
      const { client_name } = req.body;

      if (!client_name || client_name.trim().length === 0) {
        return ApiResponse.error(res, 'Nome do cliente é obrigatório', 400);
      }

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Verificar se a venda existe e pegar o dono
        const saleResult = await client.query(
          'SELECT user_id, client_name, status FROM sales WHERE id = $1',
          [saleId]
        );

        if (saleResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return ApiResponse.error(res, 'Venda não encontrada', 404);
        }

        const sale = saleResult.rows[0];

        // CEO, financeiro e admin podem editar qualquer venda
        const canEditAny = userRole && ['ceo', 'financeiro', 'admin'].includes(userRole);

        if (!canEditAny) {
          // Para outros, verificar se é o dono da venda ou superior na hierarquia
          if (sale.user_id !== userId) {
            // Verificar se o usuário é superior hierárquico
            const hierarchyResult = await client.query(
              `WITH RECURSIVE hierarchy AS (
                SELECT id, parent_id, role
                FROM users
                WHERE id = $1
                
                UNION ALL
                
                SELECT u.id, u.parent_id, u.role
                FROM users u
                INNER JOIN hierarchy h ON u.parent_id = h.id
              )
              SELECT id FROM hierarchy WHERE id = $2`,
              [sale.user_id, userId]
            );

            if (hierarchyResult.rows.length === 0) {
              await client.query('ROLLBACK');
              return ApiResponse.error(
                res,
                'Você não tem permissão para editar esta venda',
                403
              );
            }
          }
        }

        // Atualizar o nome do cliente
        const updateResult = await client.query(
          `UPDATE sales 
           SET client_name = $1, updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [client_name.trim(), saleId]
        );

        await client.query('COMMIT');

        return ApiResponse.success(
          res,
          updateResult.rows[0],
          'Cliente atualizado com sucesso'
        );
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      return ApiResponse.error(
        res,
        error.message || 'Erro ao atualizar cliente',
        500
      );
    }
  }
}

export const updateClientController = new UpdateClientController();
