// backend/src/modules/appointments/appointment.controller.ts

import { Request, Response } from 'express';
import { appointmentService } from './appointment.service';

export class AppointmentController {
  // POST /api/appointments
  async createAppointment(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;
      const appointmentData = req.body;

      const appointment = await appointmentService.createAppointment(userId, appointmentData);

      return res.status(201).json({
        success: true,
        data: appointment,
        message: 'Agendamento criado com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar agendamento',
      });
    }
  }

  // GET /api/appointments
  async getUserAppointments(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;
      const { status, type, startDate, endDate } = req.query;

      const appointments = await appointmentService.getUserAppointments(userId, {
        status: status as string,
        type: type as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      return res.json({
        success: true,
        data: appointments,
        count: appointments.length,
      });
    } catch (error: any) {
      console.error('Erro ao buscar agendamentos:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar agendamentos',
      });
    }
  }

  // GET /api/appointments/:id
  async getAppointmentById(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;
      const { id } = req.params;

      const appointment = await appointmentService.getAppointmentById(id, userId);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado',
        });
      }

      return res.json({
        success: true,
        data: appointment,
      });
    } catch (error: any) {
      console.error('Erro ao buscar agendamento:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar agendamento',
      });
    }
  }

  // PUT /api/appointments/:id
  async updateAppointment(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;
      const { id } = req.params;
      const updateData = req.body;

      const appointment = await appointmentService.updateAppointment(id, userId, updateData);

      return res.json({
        success: true,
        data: appointment,
        message: 'Agendamento atualizado com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao atualizar agendamento:', error);
      
      if (error.message.includes('não encontrado') || error.message.includes('sem permissão')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar agendamento',
      });
    }
  }

  // POST /api/appointments/:id/cancel
  async cancelAppointment(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;
      const { id } = req.params;
      const { reason } = req.body;

      const appointment = await appointmentService.cancelAppointment(id, userId, reason);

      return res.json({
        success: true,
        data: appointment,
        message: 'Agendamento cancelado com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      
      if (error.message.includes('não encontrado') || error.message.includes('sem permissão')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao cancelar agendamento',
      });
    }
  }

  // POST /api/appointments/:id/complete
  async completeAppointment(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;
      const { id } = req.params;
      const { result, notes } = req.body;

      if (!result) {
        return res.status(400).json({
          success: false,
          message: 'O resultado do agendamento é obrigatório',
        });
      }

      const appointment = await appointmentService.completeAppointment(id, userId, result, notes);

      return res.json({
        success: true,
        data: appointment,
        message: 'Agendamento concluído com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao concluir agendamento:', error);
      
      if (error.message.includes('não encontrado') || error.message.includes('sem permissão')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao concluir agendamento',
      });
    }
  }

  // GET /api/appointments/today
  async getTodayAppointments(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;

      const appointments = await appointmentService.getTodayAppointments(userId);

      return res.json({
        success: true,
        data: appointments,
        count: appointments.length,
      });
    } catch (error: any) {
      console.error('Erro ao buscar agendamentos de hoje:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar agendamentos de hoje',
      });
    }
  }

  // GET /api/appointments/week
  async getWeekAppointments(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;

      const appointments = await appointmentService.getWeekAppointments(userId);

      return res.json({
        success: true,
        data: appointments,
        count: appointments.length,
      });
    } catch (error: any) {
      console.error('Erro ao buscar agendamentos da semana:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar agendamentos da semana',
      });
    }
  }

  // GET /api/appointments/stats
  async getAppointmentStats(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;

      const stats = await appointmentService.getAppointmentStats(userId);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar estatísticas',
      });
    }
  }

  // DELETE /api/appointments/:id
  async deleteAppointment(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;
      const { id } = req.params;

      const result = await appointmentService.deleteAppointment(id, userId);

      return res.json({
        success: true,
        data: result,
        message: 'Agendamento deletado com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao deletar agendamento:', error);
      
      if (error.message.includes('não encontrado') || error.message.includes('sem permissão')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao deletar agendamento',
      });
    }
  }
}

export const appointmentController = new AppointmentController();
