// frontend/src/features/appointments/components/AppointmentList.tsx

import React, { useState } from 'react';
import { Appointment } from '@/types/appointment';
import { Calendar, Clock, MapPin, Phone, Mail, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentListProps {
  appointments: Appointment[];
  onStatusChange: (id: string, status: string) => void;
  onComplete: (id: string, result: string, notes?: string) => void;
  onCancel: (id: string, reason?: string) => void;
  onDelete: (id: string) => void;
}

export function AppointmentList({
  appointments,
  onStatusChange,
  onComplete,
  onCancel,
  onDelete,
}: AppointmentListProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [completeForm, setCompleteForm] = useState({ result: '', notes: '' });
  const [cancelForm, setCancelForm] = useState({ reason: '' });

  function getStatusColor(status: string) {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      rescheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  function getStatusLabel(status: string) {
    const labels = {
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      rescheduled: 'Reagendado',
    };
    return labels[status as keyof typeof labels] || status;
  }

  function getTypeLabel(type: string) {
    const labels = {
      visit: 'Visita',
      quotation: 'Cotação',
      installation: 'Instalação',
      maintenance: 'Manutenção',
      follow_up: 'Follow-up',
      other: 'Outro',
    };
    return labels[type as keyof typeof labels] || type;
  }

  function formatDate(dateString: string) {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  }

  function handleComplete(id: string) {
    if (!completeForm.result) {
      alert('Selecione o resultado do agendamento');
      return;
    }
    onComplete(id, completeForm.result, completeForm.notes);
    setSelectedAppointment(null);
    setCompleteForm({ result: '', notes: '' });
  }

  function handleCancel(id: string) {
    onCancel(id, cancelForm.reason);
    setSelectedAppointment(null);
    setCancelForm({ reason: '' });
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
        <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">Nenhum agendamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-4">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {appointment.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(appointment.status)}`}>
                  {getStatusLabel(appointment.status)}
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {getTypeLabel(appointment.type)}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Cliente: <strong>{appointment.client_name}</strong>
              </p>
            </div>
            {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
              <button
                onClick={() => onDelete(appointment.id)}
                className="text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="break-all">{formatDate(appointment.appointment_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              {appointment.duration_minutes} minutos
            </div>
            {appointment.client_phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="break-all">{appointment.client_phone}</span>
              </div>
            )}
            {appointment.client_email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="break-all">{appointment.client_email}</span>
              </div>
            )}
            {appointment.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="break-all">{appointment.location}</span>
              </div>
            )}
          </div>

          {appointment.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              {appointment.description}
            </p>
          )}

          {appointment.estimated_power && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Potência estimada: <strong>{appointment.estimated_power} kW</strong>
            </div>
          )}

          {appointment.estimated_value && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Valor estimado: <strong>R$ {appointment.estimated_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          )}

          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <div className="flex gap-2 flex-wrap">
              {appointment.status === 'scheduled' && (
                <button
                  onClick={() => onStatusChange(appointment.id, 'confirmed')}
                  className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700"
                >
                  Confirmar
                </button>
              )}
              
              {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                <button
                  onClick={() => onStatusChange(appointment.id, 'in_progress')}
                  className="px-2 sm:px-3 py-1 bg-yellow-600 text-white rounded text-xs sm:text-sm hover:bg-yellow-700"
                >
                  Iniciar
                </button>
              )}

              {(appointment.status === 'in_progress' || appointment.status === 'confirmed') && (
                <>
                  {selectedAppointment === `complete-${appointment.id}` ? (
                    <div className="w-full space-y-2 mt-2">
                      <select
                        value={completeForm.result}
                        onChange={(e) => setCompleteForm({ ...completeForm, result: e.target.value })}
                        className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm"
                      >
                        <option value="">Selecione o resultado</option>
                        <option value="sale_closed">Venda Fechada</option>
                        <option value="proposal_sent">Proposta Enviada</option>
                        <option value="follow_up_needed">Necessita Follow-up</option>
                        <option value="lost">Perdido</option>
                        <option value="pending">Pendente</option>
                      </select>
                      <textarea
                        value={completeForm.notes}
                        onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
                        placeholder="Observações..."
                        className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm"
                        rows={2}
                      />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleComplete(appointment.id)}
                          className="w-full sm:w-auto px-2 sm:px-3 py-1 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700"
                        >
                          Confirmar Conclusão
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAppointment(null);
                            setCompleteForm({ result: '', notes: '' });
                          }}
                          className="w-full sm:w-auto px-2 sm:px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs sm:text-sm hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedAppointment(`complete-${appointment.id}`)}
                      className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      Concluir
                    </button>
                  )}
                </>
              )}

              {selectedAppointment === `cancel-${appointment.id}` ? (
                <div className="w-full space-y-2 mt-2">
                  <input
                    type="text"
                    value={cancelForm.reason}
                    onChange={(e) => setCancelForm({ reason: e.target.value })}
                    placeholder="Motivo do cancelamento..."
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleCancel(appointment.id)}
                      className="w-full sm:w-auto px-2 sm:px-3 py-1 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700"
                    >
                      Confirmar Cancelamento
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAppointment(null);
                        setCancelForm({ reason: '' });
                      }}
                      className="w-full sm:w-auto px-2 sm:px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs sm:text-sm hover:bg-gray-400"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedAppointment(`cancel-${appointment.id}`)}
                  className="px-2 sm:px-3 py-1 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700 flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  Cancelar
                </button>
              )}
            </div>
          )}

          {appointment.status === 'completed' && appointment.result && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
              <p className="text-sm font-medium text-green-900 dark:text-green-400">
                Resultado: {appointment.result.replace(/_/g, ' ').toUpperCase()}
              </p>
              {appointment.notes && (
                <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                  {appointment.notes}
                </p>
              )}
            </div>
          )}

          {appointment.status === 'cancelled' && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-sm font-medium text-red-900 dark:text-red-400">
                Cancelado
                {appointment.cancellation_reason && `: ${appointment.cancellation_reason}`}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
