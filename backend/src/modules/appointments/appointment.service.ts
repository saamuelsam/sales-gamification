// backend/src/modules/appointments/appointment.service.ts

import { pool } from '@config/database';
import { PoolClient } from 'pg';

export interface CreateAppointmentData {
  client_name: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  appointment_date: Date | string;
  duration_minutes?: number;
  type: 'visit' | 'quotation' | 'installation' | 'maintenance' | 'follow_up' | 'other';
  title: string;
  description?: string;
  location?: string;
  estimated_power?: number;
  estimated_value?: number;
}

export interface UpdateAppointmentData {
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  appointment_date?: Date | string;
  duration_minutes?: number;
  type?: 'visit' | 'quotation' | 'installation' | 'maintenance' | 'follow_up' | 'other';
  status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  title?: string;
  description?: string;
  location?: string;
  estimated_power?: number;
  estimated_value?: number;
  result?: 'sale_closed' | 'proposal_sent' | 'follow_up_needed' | 'lost' | 'pending';
  notes?: string;
}

export class AppointmentService {
  // Criar novo agendamento
  async createAppointment(userId: string, data: CreateAppointmentData) {
    const query = `
      INSERT INTO appointments (
        user_id, client_name, client_phone, client_email, client_address,
        appointment_date, duration_minutes, type, title, description, location,
        estimated_power, estimated_value
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      userId,
      data.client_name,
      data.client_phone || null,
      data.client_email || null,
      data.client_address || null,
      data.appointment_date,
      data.duration_minutes || 60,
      data.type,
      data.title,
      data.description || null,
      data.location || null,
      data.estimated_power || null,
      data.estimated_value || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Listar agendamentos do usuário
  async getUserAppointments(
    userId: string,
    filters?: {
      status?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    let query = `
      SELECT 
        a.*,
        u.name as user_name,
        u.email as user_email
      FROM appointments a
      INNER JOIN users u ON u.id = a.user_id
      WHERE a.user_id = $1
    `;

    const values: any[] = [userId];
    let paramCount = 1;

    if (filters?.status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters?.type) {
      paramCount++;
      query += ` AND a.type = $${paramCount}`;
      values.push(filters.type);
    }

    if (filters?.startDate) {
      paramCount++;
      query += ` AND a.appointment_date >= $${paramCount}`;
      values.push(filters.startDate);
    }

    if (filters?.endDate) {
      paramCount++;
      query += ` AND a.appointment_date <= $${paramCount}`;
      values.push(filters.endDate);
    }

    query += ` ORDER BY a.appointment_date ASC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Buscar agendamento por ID
  async getAppointmentById(appointmentId: string, userId: string) {
    const query = `
      SELECT 
        a.*,
        u.name as user_name,
        u.email as user_email
      FROM appointments a
      INNER JOIN users u ON u.id = a.user_id
      WHERE a.id = $1 AND a.user_id = $2
    `;

    const result = await pool.query(query, [appointmentId, userId]);
    return result.rows[0];
  }

  // Atualizar agendamento
  async updateAppointment(appointmentId: string, userId: string, data: UpdateAppointmentData) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    paramCount++;
    values.push(appointmentId);
    paramCount++;
    values.push(userId);

    const query = `
      UPDATE appointments
      SET ${fields.join(', ')}
      WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    
    if (result.rowCount === 0) {
      throw new Error('Agendamento não encontrado ou sem permissão');
    }

    return result.rows[0];
  }

  // Cancelar agendamento
  async cancelAppointment(appointmentId: string, userId: string, reason?: string) {
    const query = `
      UPDATE appointments
      SET 
        status = 'cancelled',
        cancelled_at = CURRENT_TIMESTAMP,
        cancellation_reason = $3
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [appointmentId, userId, reason || null]);
    
    if (result.rowCount === 0) {
      throw new Error('Agendamento não encontrado ou sem permissão');
    }

    return result.rows[0];
  }

  // Completar agendamento
  async completeAppointment(
    appointmentId: string,
    userId: string,
    result: 'sale_closed' | 'proposal_sent' | 'follow_up_needed' | 'lost' | 'pending',
    notes?: string
  ) {
    const query = `
      UPDATE appointments
      SET 
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        result = $3,
        notes = $4
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const queryResult = await pool.query(query, [appointmentId, userId, result, notes || null]);
    
    if (queryResult.rowCount === 0) {
      throw new Error('Agendamento não encontrado ou sem permissão');
    }

    return queryResult.rows[0];
  }

  // Buscar agendamentos do dia
  async getTodayAppointments(userId: string) {
    const query = `
      SELECT *
      FROM appointments
      WHERE user_id = $1
        AND DATE(appointment_date) = CURRENT_DATE
        AND status NOT IN ('cancelled', 'completed')
      ORDER BY appointment_date ASC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Buscar agendamentos da semana
  async getWeekAppointments(userId: string) {
    const query = `
      SELECT *
      FROM appointments
      WHERE user_id = $1
        AND appointment_date >= CURRENT_DATE
        AND appointment_date < CURRENT_DATE + INTERVAL '7 days'
        AND status NOT IN ('cancelled')
      ORDER BY appointment_date ASC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Estatísticas de agendamentos
  async getAppointmentStats(userId: string) {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE result = 'sale_closed') as sales_closed,
        COUNT(*) FILTER (WHERE result = 'proposal_sent') as proposals_sent,
        COUNT(*) FILTER (WHERE result = 'lost') as lost,
        COUNT(*) FILTER (WHERE DATE(appointment_date) = CURRENT_DATE AND status NOT IN ('cancelled', 'completed')) as today,
        COUNT(*) FILTER (WHERE appointment_date >= CURRENT_DATE AND appointment_date < CURRENT_DATE + INTERVAL '7 days' AND status NOT IN ('cancelled', 'completed')) as this_week
      FROM appointments
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  // Deletar agendamento (apenas admin ou dono)
  async deleteAppointment(appointmentId: string, userId: string) {
    const query = `
      DELETE FROM appointments
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await pool.query(query, [appointmentId, userId]);
    
    if (result.rowCount === 0) {
      throw new Error('Agendamento não encontrado ou sem permissão');
    }

    return { success: true, id: result.rows[0].id };
  }
}

export const appointmentService = new AppointmentService();
