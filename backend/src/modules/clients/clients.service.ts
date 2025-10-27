import { pool } from '../../config/database';

interface CreateClientData {
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export class ClientsService {
  async createClient(userId: string, data: CreateClientData) {
    const result = await pool.query(
      `INSERT INTO clients (
        user_id, name, cpf, phone, email,
        cep, street, number, complement, neighborhood, city, state
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        userId,
        data.name,
        data.cpf || null,
        data.phone || null,
        data.email || null,
        data.cep || null,
        data.street || null,
        data.number || null,
        data.complement || null,
        data.neighborhood || null,
        data.city || null,
        data.state || null,
      ]
    );
    return result.rows[0];
  }

  async listUserClients(userId: string) {
    const result = await pool.query(
      'SELECT * FROM clients WHERE user_id = $1 ORDER BY name ASC',
      [userId]
    );
    return result.rows;
  }

  async getClientById(clientId: string, userId: string) {
    const result = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
      [clientId, userId]
    );
    if (result.rows.length === 0) {
      throw new Error('Cliente não encontrado');
    }
    return result.rows[0];
  }

  // --- MÉTODO ADICIONADO ---
  async updateClient(clientId: string, userId: string, data: Partial<CreateClientData>) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.cpf !== undefined) {
      updates.push(`cpf = $${paramIndex++}`);
      values.push(data.cpf);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }
    if (data.cep !== undefined) {
      updates.push(`cep = $${paramIndex++}`);
      values.push(data.cep);
    }
    if (data.street !== undefined) {
      updates.push(`street = $${paramIndex++}`);
      values.push(data.street);
    }
    if (data.number !== undefined) {
      updates.push(`number = $${paramIndex++}`);
      values.push(data.number);
    }
    if (data.complement !== undefined) {
      updates.push(`complement = $${paramIndex++}`);
      values.push(data.complement);
    }
    if (data.neighborhood !== undefined) {
      updates.push(`neighborhood = $${paramIndex++}`);
      values.push(data.neighborhood);
    }
    if (data.city !== undefined) {
      updates.push(`city = $${paramIndex++}`);
      values.push(data.city);
    }
    if (data.state !== undefined) {
      updates.push(`state = $${paramIndex++}`);
      values.push(data.state);
    }

    updates.push(`updated_at = NOW()`);
    values.push(clientId, userId);

    const query = `
      UPDATE clients 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Cliente não encontrado');
    }

    return result.rows[0];
  }
}