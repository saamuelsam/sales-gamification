// frontend/src/features/appointments/pages/AppointmentsPage.tsx

import React, { useState, useEffect } from 'react';
import { appointmentService } from '@/services/appointmentService';
import { Appointment, AppointmentStats } from '@/types/appointment';
import { AppointmentForm } from '../components/AppointmentForm';
import { AppointmentList } from '../components/AppointmentList';
import { Calendar, Clock, Users, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [filterStatus, filterType]);

  async function loadData() {
    try {
      setLoading(true);
      const [appointmentsData, statsData] = await Promise.all([
        appointmentService.list({
          status: filterStatus || undefined,
          type: filterType || undefined,
        }),
        appointmentService.getStats(),
      ]);
      setAppointments(appointmentsData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: any) {
    try {
      await appointmentService.create(data);
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      await appointmentService.update(id, { status: newStatus as any });
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  }

  async function handleComplete(id: string, result: string, notes?: string) {
    try {
      await appointmentService.complete(id, result, notes);
      loadData();
    } catch (error) {
      console.error('Erro ao completar agendamento:', error);
    }
  }

  async function handleCancel(id: string, reason?: string) {
    try {
      await appointmentService.cancel(id, reason);
      loadData();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente deletar este agendamento?')) return;
    try {
      await appointmentService.delete(id);
      loadData();
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Agendamentos</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Gerencie suas visitas e cotações
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          {showForm ? 'Cancelar' : '+ Novo Agendamento'}
        </button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
            <div className="flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-1">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">Agendados</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {stats.scheduled}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
            <div className="flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-1">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">Confirmados</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {stats.confirmed}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
            <div className="flex items-center gap-1 sm:gap-2 text-green-600 text-xs sm:text-sm mb-1">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">Concluídos</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {stats.completed}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
            <div className="flex items-center gap-1 sm:gap-2 text-green-600 text-xs sm:text-sm mb-1">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">Vendas</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {stats.sales_closed}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
            <div className="flex items-center gap-1 sm:gap-2 text-red-600 text-xs sm:text-sm mb-1">
              <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">Cancelados</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {stats.cancelled}
            </div>
          </div>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Novo Agendamento
          </h2>
          <AppointmentForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="scheduled">Agendado</option>
              <option value="confirmed">Confirmado</option>
              <option value="in_progress">Em Andamento</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
              <option value="rescheduled">Reagendado</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="visit">Visita</option>
              <option value="quotation">Cotação</option>
              <option value="installation">Instalação</option>
              <option value="maintenance">Manutenção</option>
              <option value="follow_up">Follow-up</option>
              <option value="other">Outro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      <AppointmentList
        appointments={appointments}
        onStatusChange={handleStatusChange}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />
    </div>
  );
}
