// frontend/src/services/appointmentService.ts

import api from './api';
import { Appointment, AppointmentStats, CreateAppointmentData, UpdateAppointmentData } from '@/types/appointment';

export interface AppointmentFilters {
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export const appointmentService = {
  // Criar agendamento
  async create(data: CreateAppointmentData): Promise<Appointment> {
    const response = await api.post<{ data: Appointment }>('/appointments', data);
    return response.data.data;
  },

  // Listar agendamentos
  async list(filters?: AppointmentFilters): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get<{ data: Appointment[] }>(
      `/appointments?${params.toString()}`
    );
    return response.data.data;
  },

  // Buscar por ID
  async getById(id: string): Promise<Appointment> {
    const response = await api.get<{ data: Appointment }>(`/appointments/${id}`);
    return response.data.data;
  },

  // Atualizar agendamento
  async update(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    const response = await api.put<{ data: Appointment }>(`/appointments/${id}`, data);
    return response.data.data;
  },

  // Cancelar agendamento
  async cancel(id: string, reason?: string): Promise<Appointment> {
    const response = await api.post<{ data: Appointment }>(`/appointments/${id}/cancel`, { reason });
    return response.data.data;
  },

  // Completar agendamento
  async complete(id: string, result: string, notes?: string): Promise<Appointment> {
    const response = await api.post<{ data: Appointment }>(`/appointments/${id}/complete`, {
      result,
      notes,
    });
    return response.data.data;
  },

  // Deletar agendamento
  async delete(id: string): Promise<void> {
    await api.delete(`/appointments/${id}`);
  },

  // Agendamentos de hoje
  async getToday(): Promise<Appointment[]> {
    const response = await api.get<{ data: Appointment[] }>('/appointments/today');
    return response.data.data;
  },

  // Agendamentos da semana
  async getWeek(): Promise<Appointment[]> {
    const response = await api.get<{ data: Appointment[] }>('/appointments/week');
    return response.data.data;
  },

  // Estatísticas
  async getStats(): Promise<AppointmentStats> {
    const response = await api.get<{ data: AppointmentStats }>('/appointments/stats');
    return response.data.data;
  },
};
